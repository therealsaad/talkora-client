// ============================================================
// FILE: client/config/talkora-assets.ts
//
// FULL FILE.
//
// This preserves your existing Talkora contracts,
// but adds the approved background + together hero asset.
// ============================================================

export const talkoraAssets = {
  environments: {
    landing:
      '/assets/talkora-world-approved.png',

    school:
      '/classroom-scenes/classroom-board.png',

    classroom:
      '/classroom-scenes/classroom-circle.png',

    lesson:
      '/classroom-scenes/classroom-lesson.png',
  },

  hero: {
    trio:
      '/assets/talkora-hero-trio.png',
  },

  julie: {
    canonical:
      '/miss-julie/standing.png',

    idle:
      '/miss-julie/standing.png',

    welcome:
      '/miss-julie/standing.png',

    listening:
      '/miss-julie/listening.png',

    thinking:
      '/miss-julie/thinking.png',

    speaking:
      '/miss-julie/speaking.png',

    curious:
      '/miss-julie/listening.png',

    encouraging:
      '/miss-julie/encouraging.png',

    correct:
      '/miss-julie/heart.png',

    try_again:
      '/miss-julie/try_again.png',

    retry:
      '/miss-julie/retry.png',

    modeling:
      '/miss-julie/teaching.png',

    hinting:
      '/miss-julie/teaching.png',

    proud:
      '/miss-julie/proud.png',

    celebrate:
      '/miss-julie/celebrating.png',

    celebrating:
      '/miss-julie/celebrating.png',

    pointing:
      '/miss-julie/pointing.png',

    reading:
      '/miss-julie/reading.png',

    teaching:
      '/miss-julie/teaching.png',

    standing:
      '/miss-julie/standing.png',
  },

  students: {
    BOY:
      '/talkora/characters/students/boy/canonical.png',

    GIRL:
      '/talkora/characters/students/girl/canonical.png',
  },

  avatars: {
    aarav:
      '/avatars/aarav.png',

    ananya:
      '/avatars/ananya.png',

    kabir:
      '/avatars/kabir.png',

    meera:
      '/avatars/meera.png',

    rahul:
      '/avatars/rahul.png',

    sara:
      '/avatars/sara.png',

    rehan:
      '/avatars/aarav.png',

    vihaan:
      '/avatars/kabir.png',

    arjun:
      '/avatars/rahul.png',

    ibrahim:
      '/avatars/aarav.png',

    zara:
      '/avatars/ananya.png',

    myra:
      '/avatars/sara.png',

    aisha:
      '/avatars/ananya.png',

    diya:
      '/avatars/meera.png',

    pari:
      '/avatars/sara.png',
  },

  avatarFallbacks: [
    '/avatars/aarav.png',
    '/avatars/ananya.png',
    '/avatars/kabir.png',
    '/avatars/meera.png',
    '/avatars/rahul.png',
    '/avatars/sara.png',
  ],
} as const

export type MissJulieState =
  keyof typeof talkoraAssets.julie

export type LearnerAvatarType =
  keyof typeof talkoraAssets.students

export function learnerAvatar(
  avatarType?: LearnerAvatarType,
) {
  return talkoraAssets.students[
    avatarType || 'BOY'
  ]
}

export function accountAvatar(
  avatar:
    string | undefined,

  stableIndex = 0,
) {
  if (
    avatar &&
    avatar in
      talkoraAssets.avatars
  ) {
    return talkoraAssets.avatars[
      avatar as keyof typeof talkoraAssets.avatars
    ]
  }

  return (
    avatar ||
    talkoraAssets.avatarFallbacks[
      Math.abs(
        stableIndex,
      ) %
        talkoraAssets
          .avatarFallbacks
          .length
    ]
  )
}