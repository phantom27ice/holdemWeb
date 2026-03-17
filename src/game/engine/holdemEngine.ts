import type {
  Action,
  EngineError,
  EngineResult,
  GameEvent,
  HandState,
  LegalAction,
  PlayerState,
  Street,
} from '../types'
import { createDeck } from './deck'
import { compareRank, evaluate7 } from './handEvaluator'

export interface EngineConfig {
  smallBlind: number
  bigBlind: number
  ante: number
}

export interface TablePlayerInput {
  seat: number
  id: string
  name: string
  stack: number
}

export function createInitialHandState(
  players: TablePlayerInput[],
  config: EngineConfig,
): HandState {
  const sortedPlayers = [...players].sort((a, b) => a.seat - b.seat)
  const lastSeat = sortedPlayers[sortedPlayers.length - 1]?.seat ?? 0

  return {
    handId: 0,
    phase: 'WAITING_FOR_PLAYERS',
    street: 'PRE_FLOP',
    dealerSeat: lastSeat,
    sbSeat: lastSeat,
    bbSeat: lastSeat,
    toActSeat: -1,
    smallBlind: config.smallBlind,
    bigBlind: config.bigBlind,
    ante: config.ante,
    board: [],
    burn: [],
    deck: createDeck(),
    currentBet: 0,
    lastFullRaiseSize: config.bigBlind,
    players: sortedPlayers.map(toPlayerState),
    pots: [],
    uncalledReturn: 0,
    winnerSeatIds: [],
  }
}

export function dispatch(state: HandState, action: Action): EngineResult {
  const inputInvariantError = getInvariantError(state, action.type)
  if (inputInvariantError) {
    return {
      state,
      events: [],
      error: inputInvariantError,
    }
  }

  const working = structuredClone(state)
  const events: GameEvent[] = []
  let error: EngineError | undefined

  switch (action.type) {
    case 'START_HAND': {
      startHand(working, action.seed)
      events.push({ type: 'HAND_STARTED', handId: working.handId })
      break
    }

    case 'POST_FORCED_BETS': {
      if (working.phase !== 'POST_FORCED_BETS') {
        error = createEngineError(
          'INVALID_PHASE',
          action,
          `POST_FORCED_BETS is not allowed in phase ${working.phase}`,
        )
        break
      }

      postForcedBets(working)
      break
    }

    case 'DEAL_HOLE_CARDS': {
      if (working.phase !== 'DEAL_HOLE_CARDS') {
        error = createEngineError(
          'INVALID_PHASE',
          action,
          `DEAL_HOLE_CARDS is not allowed in phase ${working.phase}`,
        )
        break
      }

      dealHoleCards(working, events)
      beginPreFlopBetting(working)
      break
    }

    case 'CHECK':
    case 'CALL':
    case 'FOLD':
    case 'BET':
    case 'RAISE':
    case 'ALL_IN': {
      const result = applyPlayerAction(working, action, events)
      error = result.error
      break
    }

    case 'ADVANCE_STREET': {
      if (!isBettingPhase(working.phase)) {
        error = createEngineError(
          'INVALID_PHASE',
          action,
          `ADVANCE_STREET is not allowed in phase ${working.phase}`,
        )
        break
      }

      advanceStreet(working, events)
      break
    }

    case 'SHOWDOWN': {
      working.phase = 'SHOWDOWN'
      working.street = 'SHOWDOWN'
      working.toActSeat = -1
      break
    }

    case 'PAYOUT': {
      working.phase = 'PAYOUT'
      working.toActSeat = -1
      break
    }

    default:
      assertNever(action)
  }

  if (error) {
    return {
      state,
      events: [],
      error,
    }
  }

  const outputInvariantError = getInvariantError(working, action.type)
  if (outputInvariantError) {
    return {
      state,
      events: [],
      error: outputInvariantError,
    }
  }

  return {
    state: working,
    events,
  }
}

export function getLegalActions(state: HandState, seat: number): LegalAction[] {
  if (!isBettingPhase(state.phase) || state.toActSeat !== seat) {
    return []
  }

  const player = findPlayer(state, seat)
  if (!player || player.hasFolded || player.isAllIn || !player.inHand) {
    return []
  }

  const toCall = Math.max(0, state.currentBet - player.streetCommit)
  const maxAmountTo = player.streetCommit + player.stack
  const actions: LegalAction[] = []

  if (toCall > 0) {
    actions.push({ type: 'FOLD' })
    actions.push({ type: 'CALL', toCall })
  } else {
    actions.push({ type: 'CHECK' })
  }

  if (state.currentBet === 0) {
    if (maxAmountTo >= state.bigBlind) {
      actions.push({
        type: 'BET',
        minAmountTo: state.bigBlind,
        maxAmountTo,
      })
    }
  } else {
    const minRaiseTo = state.currentBet + state.lastFullRaiseSize
    if (maxAmountTo >= minRaiseTo) {
      actions.push({
        type: 'RAISE',
        minAmountTo: minRaiseTo,
        maxAmountTo,
      })
    }
  }

  if (player.stack > 0) {
    actions.push({ type: 'ALL_IN', maxAmountTo })
  }

  return actions
}

function startHand(state: HandState, seed?: number): void {
  state.handId += 1
  state.phase = 'POST_FORCED_BETS'
  state.street = 'PRE_FLOP'
  state.seed = seed
  state.board = []
  state.burn = []
  state.pots = []
  state.uncalledReturn = 0
  state.winnerSeatIds = []
  state.currentBet = 0
  state.lastFullRaiseSize = state.bigBlind

  for (const player of state.players) {
    player.holeCards = []
    player.inHand = player.stack > 0
    player.hasFolded = false
    player.isAllIn = false
    player.streetCommit = 0
    player.handCommit = 0
    player.actedThisStreet = false
  }

  const activeSeats = getInHandSeats(state)
  if (activeSeats.length < 2) {
    state.phase = 'WAITING_FOR_PLAYERS'
    state.toActSeat = -1
    return
  }

  state.dealerSeat = nextSeatFromList(activeSeats, state.dealerSeat)

  if (activeSeats.length === 2) {
    state.sbSeat = state.dealerSeat
    state.bbSeat = nextSeatFromList(activeSeats, state.sbSeat)
  } else {
    state.sbSeat = nextSeatFromList(activeSeats, state.dealerSeat)
    state.bbSeat = nextSeatFromList(activeSeats, state.sbSeat)
  }

  state.toActSeat = -1
  state.deck = shuffleDeck(createDeck(), seed)
}

function postForcedBets(state: HandState): void {
  if (state.phase !== 'POST_FORCED_BETS') {
    return
  }

  postBlind(state, state.sbSeat, state.smallBlind)
  postBlind(state, state.bbSeat, state.bigBlind)

  state.currentBet = state.bigBlind
  state.lastFullRaiseSize = state.bigBlind
  state.phase = 'DEAL_HOLE_CARDS'
}

function dealHoleCards(state: HandState, events: GameEvent[]): void {
  if (state.phase !== 'DEAL_HOLE_CARDS') {
    return
  }

  const seats = getInHandSeats(state)
  if (seats.length < 2) {
    state.phase = 'WAITING_FOR_PLAYERS'
    state.toActSeat = -1
    return
  }

  const dealOrder = getDealOrder(state, seats)

  for (let round = 0; round < 2; round += 1) {
    for (const seat of dealOrder) {
      const card = drawCard(state)
      if (!card) {
        continue
      }

      const player = findPlayer(state, seat)
      if (!player) {
        continue
      }

      player.holeCards.push(card)
    }
  }

  for (const seat of seats) {
    events.push({ type: 'CARDS_DEALT', seat, count: 2 })
  }
}

function beginPreFlopBetting(state: HandState): void {
  state.phase = 'BETTING_PRE_FLOP'
  state.street = 'PRE_FLOP'

  for (const player of state.players) {
    player.actedThisStreet = player.hasFolded || !player.inHand || player.isAllIn
  }

  if (getInHandSeats(state).length === 2) {
    state.toActSeat = state.sbSeat
  } else {
    state.toActSeat = getNextActiveActorSeat(state, state.bbSeat)
  }
}

function applyPlayerAction(
  state: HandState,
  action: Action,
  events: GameEvent[],
): { error?: EngineError } {
  if (!('seat' in action)) {
    return {
      error: createEngineError('ILLEGAL_ACTION', action, 'Seat action is required'),
    }
  }

  if (!isBettingPhase(state.phase)) {
    return {
      error: createEngineError(
        'INVALID_PHASE',
        action,
        `Action ${action.type} is not allowed in phase ${state.phase}`,
        action.seat,
      ),
    }
  }

  const seat = action.seat
  if (seat !== state.toActSeat) {
    return {
      error: createEngineError(
        'NOT_ACTOR_TURN',
        action,
        `Seat ${seat} is not current actor, expected ${state.toActSeat}`,
        seat,
      ),
    }
  }

  const player = findPlayer(state, seat)
  if (!player) {
    return {
      error: createEngineError('PLAYER_NOT_FOUND', action, `Seat ${seat} not found`, seat),
    }
  }

  const legalActions = getLegalActions(state, seat)
  const matchedAction = legalActions.find((item) => item.type === action.type)
  if (!matchedAction) {
    return {
      error: createEngineError(
        'ILLEGAL_ACTION',
        action,
        `Action ${action.type} is not legal for seat ${seat} in current state`,
        seat,
      ),
    }
  }

  if (action.type === 'FOLD') {
    player.hasFolded = true
    player.actedThisStreet = true
    events.push({ type: 'ACTION_APPLIED', seat, action: action.type, amount: 0 })
  }

  if (action.type === 'CHECK') {
    player.actedThisStreet = true
    events.push({ type: 'ACTION_APPLIED', seat, action: action.type, amount: 0 })
  }

  if (action.type === 'CALL') {
    const toAmount = state.currentBet
    const paid = commitToAmount(player, toAmount)
    player.actedThisStreet = true
    events.push({ type: 'ACTION_APPLIED', seat, action: action.type, amount: paid })
  }

  if (action.type === 'BET' || action.type === 'RAISE') {
    if (!('amountTo' in action)) {
      return {
        error: createEngineError(
          'INVALID_AMOUNT',
          action,
          `Action ${action.type} requires amountTo`,
          seat,
        ),
      }
    }

    const minAmount = matchedAction.minAmountTo ?? action.amountTo
    const maxAmount = matchedAction.maxAmountTo ?? action.amountTo

    if (action.amountTo < minAmount || action.amountTo > maxAmount) {
      return {
        error: createEngineError(
          'INVALID_AMOUNT',
          action,
          `amountTo ${action.amountTo} is outside legal range [${minAmount}, ${maxAmount}]`,
          seat,
        ),
      }
    }

    const previousBet = state.currentBet
    const paid = commitToAmount(player, action.amountTo)
    const actualTo = player.streetCommit

    state.currentBet = actualTo
    const raiseSize = actualTo - previousBet
    if (raiseSize >= state.lastFullRaiseSize) {
      state.lastFullRaiseSize = raiseSize
    }

    resetActedFlagsForAggression(state, seat)
    player.actedThisStreet = true

    events.push({
      type: 'ACTION_APPLIED',
      seat,
      action: action.type,
      amount: paid,
    })
  }

  if (action.type === 'ALL_IN') {
    const allInTo = player.streetCommit + player.stack
    const previousBet = state.currentBet
    const paid = commitToAmount(player, allInTo)

    if (player.streetCommit > previousBet) {
      state.currentBet = player.streetCommit
      const raiseSize = player.streetCommit - previousBet
      if (raiseSize >= state.lastFullRaiseSize) {
        state.lastFullRaiseSize = raiseSize
      }
      resetActedFlagsForAggression(state, seat)
    }

    player.actedThisStreet = true

    events.push({
      type: 'ACTION_APPLIED',
      seat,
      action: action.type,
      amount: paid,
    })
  }

  const remaining = getContestingPlayers(state)
  if (remaining.length <= 1) {
    if (remaining.length === 1) {
      resolveSingleWinnerPayout(state, remaining[0].seat, events)
    } else {
      state.phase = 'PAYOUT'
      state.toActSeat = -1
      state.winnerSeatIds = []
    }
    return {}
  }

  if (isBettingRoundComplete(state)) {
    events.push({ type: 'STREET_ENDED', street: state.street })
    advanceStreet(state, events)
    return {}
  }

  state.toActSeat = getNextActiveActorSeat(state, seat)
  return {}
}

function advanceStreet(state: HandState, events: GameEvent[]): void {
  if (state.phase === 'PAYOUT' || state.phase === 'SHOWDOWN' || state.phase === 'HAND_FINISHED') {
    return
  }

  if (allContestingPlayersAllIn(state)) {
    runoutBoardToShowdown(state, events)
    return
  }

  if (state.street === 'PRE_FLOP') {
    revealFlop(state, events)
    beginPostFlopStreet(state, 'FLOP', 'BETTING_FLOP', events)
    return
  }

  if (state.street === 'FLOP') {
    revealTurn(state, events)
    beginPostFlopStreet(state, 'TURN', 'BETTING_TURN', events)
    return
  }

  if (state.street === 'TURN') {
    revealRiver(state, events)
    beginPostFlopStreet(state, 'RIVER', 'BETTING_RIVER', events)
    return
  }

  if (state.street === 'RIVER') {
    state.street = 'SHOWDOWN'
    state.phase = 'SHOWDOWN'
    state.toActSeat = -1
    resolveSinglePotShowdown(state, events)
  }
}

function beginPostFlopStreet(
  state: HandState,
  street: Street,
  phase: HandState['phase'],
  events: GameEvent[],
): void {
  state.street = street
  state.phase = phase
  state.currentBet = 0
  state.lastFullRaiseSize = state.bigBlind

  for (const player of state.players) {
    player.streetCommit = 0
    player.actedThisStreet = player.hasFolded || !player.inHand || player.isAllIn
  }

  state.toActSeat = getFirstPostFlopActor(state)

  if (state.toActSeat === -1) {
    runoutBoardToShowdown(state, events)
  }
}

function revealFlop(state: HandState, events: GameEvent[]): void {
  burnOne(state)
  const cards = drawMany(state, 3)
  state.board.push(...cards)
  events.push({ type: 'BOARD_DEALT', street: 'FLOP', cards })
}

function revealTurn(state: HandState, events: GameEvent[]): void {
  burnOne(state)
  const cards = drawMany(state, 1)
  state.board.push(...cards)
  events.push({ type: 'BOARD_DEALT', street: 'TURN', cards })
}

function revealRiver(state: HandState, events: GameEvent[]): void {
  burnOne(state)
  const cards = drawMany(state, 1)
  state.board.push(...cards)
  events.push({ type: 'BOARD_DEALT', street: 'RIVER', cards })
}

function runoutBoardToShowdown(state: HandState, events: GameEvent[]): void {
  if (state.street === 'PRE_FLOP') {
    revealFlop(state, events)
    state.street = 'FLOP'
  }

  if (state.street === 'FLOP') {
    revealTurn(state, events)
    state.street = 'TURN'
  }

  if (state.street === 'TURN') {
    revealRiver(state, events)
    state.street = 'RIVER'
  }

  state.phase = 'SHOWDOWN'
  state.street = 'SHOWDOWN'
  state.toActSeat = -1
  resolveSinglePotShowdown(state, events)
}

function resetActedFlagsForAggression(state: HandState, aggressorSeat: number): void {
  for (const player of state.players) {
    if (player.seat === aggressorSeat) {
      continue
    }

    if (!player.inHand || player.hasFolded || player.isAllIn) {
      continue
    }

    player.actedThisStreet = false
  }
}

function isBettingRoundComplete(state: HandState): boolean {
  const actionable = state.players.filter(
    (player) => player.inHand && !player.hasFolded && !player.isAllIn,
  )

  if (actionable.length === 0) {
    return true
  }

  return actionable.every(
    (player) => player.actedThisStreet && player.streetCommit === state.currentBet,
  )
}

function allContestingPlayersAllIn(state: HandState): boolean {
  const players = getContestingPlayers(state)
  return players.length > 1 && players.every((player) => player.isAllIn)
}

function getContestingPlayers(state: HandState): PlayerState[] {
  return state.players.filter((player) => player.inHand && !player.hasFolded)
}

function resolveSingleWinnerPayout(
  state: HandState,
  winnerSeat: number,
  events: GameEvent[],
): void {
  awardMainPot(state, [winnerSeat], events, [winnerSeat])
}

function resolveSinglePotShowdown(state: HandState, events: GameEvent[]): void {
  const contenders = getContestingPlayers(state).filter((player) => player.holeCards.length === 2)
  if (contenders.length === 0) {
    state.winnerSeatIds = []
    state.phase = 'PAYOUT'
    state.toActSeat = -1
    return
  }

  const ranked = contenders.map((player) => {
    const evaluated = evaluate7([...player.holeCards, ...state.board])
    events.push({
      type: 'SHOWDOWN_REVEAL',
      seat: player.seat,
      cards: player.holeCards,
    })
    return {
      seat: player.seat,
      rank: evaluated.rank,
    }
  })

  let winners = [ranked[0]]
  for (let index = 1; index < ranked.length; index += 1) {
    const candidate = ranked[index]
    const compared = compareRank(candidate.rank, winners[0].rank)

    if (compared > 0) {
      winners = [candidate]
    } else if (compared === 0) {
      winners.push(candidate)
    }
  }

  const winnerSeats = winners.map((winner) => winner.seat)
  const eligibleSeats = contenders.map((player) => player.seat)
  awardMainPot(state, winnerSeats, events, eligibleSeats)
}

function awardMainPot(
  state: HandState,
  winnerSeats: number[],
  events: GameEvent[],
  eligibleSeats: number[],
): void {
  const potAmount = state.players.reduce((sum, player) => sum + player.handCommit, 0)
  const normalizedWinners = [...new Set(winnerSeats)]

  if (normalizedWinners.length === 0) {
    state.winnerSeatIds = []
    state.phase = 'PAYOUT'
    state.toActSeat = -1
    return
  }

  const share = potAmount > 0 ? Math.floor(potAmount / normalizedWinners.length) : 0
  const oddChip = potAmount > 0 ? potAmount - share * normalizedWinners.length : 0

  for (const seat of normalizedWinners) {
    const player = findPlayer(state, seat)
    if (!player) {
      continue
    }

    player.stack += share
  }

  if (oddChip > 0) {
    const oddSeat = pickOddChipWinner(state, normalizedWinners)
    const oddWinner = findPlayer(state, oddSeat)
    if (oddWinner) {
      oddWinner.stack += oddChip
    }
  }

  state.winnerSeatIds = normalizedWinners
  state.pots = [
    {
      id: 'main',
      amount: potAmount,
      eligibleSeats: [...new Set(eligibleSeats)],
      level: 1,
    },
  ]
  state.phase = 'PAYOUT'
  state.toActSeat = -1

  events.push({
    type: 'POT_AWARDED',
    potId: 'main',
    winners: normalizedWinners,
    amount: potAmount,
  })
}

function pickOddChipWinner(state: HandState, winners: number[]): number {
  const order = getClockwiseSeatsFromButtonLeft(state)
  const winner = order.find((seat) => winners.includes(seat))
  return winner ?? winners[0]
}

function getClockwiseSeatsFromButtonLeft(state: HandState): number[] {
  const seats = state.players.map((player) => player.seat).sort((a, b) => a - b)
  if (seats.length === 0) {
    return []
  }

  const first = nextSeatFromList(seats, state.dealerSeat)
  return rotateSeats(seats, first)
}

function postBlind(state: HandState, seat: number, amount: number): void {
  const player = findPlayer(state, seat)
  if (!player) {
    return
  }

  commitToAmount(player, player.streetCommit + amount)
}

function commitToAmount(player: PlayerState, amountTo: number): number {
  const need = Math.max(0, amountTo - player.streetCommit)
  const paid = Math.min(need, player.stack)

  player.stack -= paid
  player.streetCommit += paid
  player.handCommit += paid

  if (player.stack === 0) {
    player.isAllIn = true
  }

  return paid
}

function findPlayer(state: HandState, seat: number): PlayerState | undefined {
  return state.players.find((player) => player.seat === seat)
}

function getInHandSeats(state: HandState): number[] {
  return state.players
    .filter((player) => player.inHand)
    .map((player) => player.seat)
    .sort((a, b) => a - b)
}

function getDealOrder(state: HandState, seats: number[]): number[] {
  const first = nextSeatFromList(seats, state.dealerSeat)
  return rotateSeats(seats, first)
}

function getFirstPostFlopActor(state: HandState): number {
  return getNextActiveActorSeat(state, state.dealerSeat)
}

function getNextActiveActorSeat(state: HandState, fromSeat: number): number {
  const seats = state.players.map((player) => player.seat).sort((a, b) => a - b)

  if (seats.length === 0) {
    return -1
  }

  const startIndex = seats.indexOf(fromSeat)
  const baseIndex = startIndex === -1 ? 0 : startIndex

  for (let step = 1; step <= seats.length; step += 1) {
    const seat = seats[(baseIndex + step) % seats.length]
    const player = findPlayer(state, seat)

    if (!player || !player.inHand || player.hasFolded || player.isAllIn) {
      continue
    }

    return seat
  }

  return -1
}

function nextSeatFromList(seats: number[], fromSeat: number): number {
  if (seats.length === 0) {
    return -1
  }

  const sorted = [...seats].sort((a, b) => a - b)
  const next = sorted.find((seat) => seat > fromSeat)
  return next ?? sorted[0]
}

function rotateSeats(seats: number[], startSeat: number): number[] {
  const sorted = [...seats].sort((a, b) => a - b)
  const startIndex = sorted.indexOf(startSeat)

  if (startIndex === -1) {
    return sorted
  }

  return [...sorted.slice(startIndex), ...sorted.slice(0, startIndex)]
}

function burnOne(state: HandState): void {
  const card = drawCard(state)
  if (card) {
    state.burn.push(card)
  }
}

function drawMany(state: HandState, count: number) {
  const cards = []

  for (let index = 0; index < count; index += 1) {
    const card = drawCard(state)
    if (card) {
      cards.push(card)
    }
  }

  return cards
}

function drawCard(state: HandState) {
  return state.deck.shift()
}

function shuffleDeck<T>(list: T[], seed?: number): T[] {
  const random = createRng(seed ?? Date.now())
  const next = [...list]

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const temp = next[i]
    next[i] = next[j]
    next[j] = temp
  }

  return next
}

function createRng(seed: number): () => number {
  let value = seed >>> 0

  return () => {
    value += 0x6d2b79f5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function isBettingPhase(phase: HandState['phase']): boolean {
  return (
    phase === 'BETTING_PRE_FLOP' ||
    phase === 'BETTING_FLOP' ||
    phase === 'BETTING_TURN' ||
    phase === 'BETTING_RIVER'
  )
}

function getInvariantError(state: HandState, actionType: Action['type']): EngineError | undefined {
  const violations = validateInvariants(state)
  if (violations.length === 0) {
    return undefined
  }

  return createEngineError(
    'INVARIANT_VIOLATION',
    { type: actionType } as Action,
    `Invariant violation: ${violations[0]}`,
  )
}

function validateInvariants(state: HandState): string[] {
  const violations: string[] = []

  if (state.currentBet < 0) {
    violations.push('currentBet must be >= 0')
  }

  if (state.lastFullRaiseSize <= 0) {
    violations.push('lastFullRaiseSize must be > 0')
  }

  if (state.board.length > 5) {
    violations.push('board must not contain more than 5 cards')
  }

  if (state.burn.length > 3) {
    violations.push('burn must not contain more than 3 cards')
  }

  let maxStreetCommit = 0

  for (const player of state.players) {
    if (player.stack < 0) {
      violations.push(`seat ${player.seat} stack must be >= 0`)
    }

    if (player.streetCommit < 0) {
      violations.push(`seat ${player.seat} streetCommit must be >= 0`)
    }

    if (player.handCommit < 0) {
      violations.push(`seat ${player.seat} handCommit must be >= 0`)
    }

    if (player.isAllIn && player.stack !== 0) {
      violations.push(`seat ${player.seat} isAllIn requires stack === 0`)
    }

    if (
      isBettingPhase(state.phase) &&
      player.inHand &&
      !player.hasFolded &&
      !player.isAllIn &&
      player.stack === 0
    ) {
      violations.push(`seat ${player.seat} with stack 0 must be marked all-in`)
    }

    maxStreetCommit = Math.max(maxStreetCommit, player.streetCommit)
  }

  if (state.currentBet !== maxStreetCommit) {
    violations.push(
      `currentBet (${state.currentBet}) must equal max streetCommit (${maxStreetCommit})`,
    )
  }

  if (isBettingPhase(state.phase)) {
    if (state.toActSeat < 0) {
      violations.push('toActSeat must be a valid seat during betting phase')
    } else {
      const toActPlayer = findPlayer(state, state.toActSeat)
      if (!toActPlayer) {
        violations.push(`toActSeat ${state.toActSeat} does not exist`)
      } else if (!toActPlayer.inHand || toActPlayer.hasFolded || toActPlayer.isAllIn) {
        violations.push(`toActSeat ${state.toActSeat} must point to an actionable player`)
      }
    }
  } else if (state.toActSeat !== -1) {
    violations.push(`toActSeat must be -1 outside betting phases, got ${state.toActSeat}`)
  }

  return violations
}

function createEngineError(
  code: EngineError['code'],
  action: Action,
  message: string,
  seat?: number,
): EngineError {
  return {
    code,
    action: action.type,
    message,
    seat,
  }
}

function toPlayerState(input: TablePlayerInput): PlayerState {
  return {
    seat: input.seat,
    id: input.id,
    name: input.name,
    stack: input.stack,
    holeCards: [],
    inHand: input.stack > 0,
    hasFolded: false,
    isAllIn: false,
    streetCommit: 0,
    handCommit: 0,
    actedThisStreet: false,
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected action: ${JSON.stringify(value)}`)
}
