// ============================================================
// page.tsx
//
// LANDING PAGE
//
// Uses:
//
// public/assets/talkora-landing-world.png
//
// public/assets/audio/miss-julie-welcome.wav
//
// IMPORTANT:
//
// The background already contains:
// - Miss Julie
// - boy
// - girl
// - Talkora wooden board
//
// DO NOT render another Julie PNG over it.
// ============================================================
'use client'

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion'

import {
  ArrowRight,
  BookOpen,
  Mic2,
  School,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react'

import Image from 'next/image'

import {
  useRouter,
} from 'next/navigation'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  TalkoraLogo,
} from '@/components/brand/talkora-logo'

const WELCOME_AUDIO =
  '/assets/audio/miss-julie-welcome.wav'


export default function Page() {
  const router =
    useRouter()

  const reduceMotion =
    useReducedMotion()

  const audioRef =
    useRef<HTMLAudioElement | null>(
      null,
    )

  const [loading, setLoading] =
    useState(true)

  const [leaving, setLeaving] =
    useState(false)

  const [speaking, setSpeaking] =
    useState(false)

  const [audioReady, setAudioReady] =
    useState(false)

  const [autoplayBlocked, setAutoplayBlocked] =
    useState(false)

  const [pointer, setPointer] =
    useState({
      x: 0,
      y: 0,
    })


  // =========================================================
  // INTRO
  // =========================================================

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          setLoading(false)
        },
        750,
      )

    return () =>
      window.clearTimeout(
        timer,
      )
  }, [])


  // =========================================================
  // AUTO MISS JULIE WELCOME
  // =========================================================

  useEffect(() => {
    if (loading) {
      return
    }

    const timer =
      window.setTimeout(
        async () => {
          const audio =
            audioRef.current

          if (!audio) {
            return
          }

          try {
            audio.currentTime = 0

            await audio.play()

            setAutoplayBlocked(
              false,
            )
          } catch {
            // Chrome/Safari may reject audible autoplay.
            // User can instantly tap Julie's voice button.

            setAutoplayBlocked(
              true,
            )
          }
        },
        350,
      )

    return () =>
      window.clearTimeout(
        timer,
      )
  }, [loading])


  // =========================================================
  // VOICE BUTTON
  // =========================================================

  async function toggleVoice() {
    const audio =
      audioRef.current

    if (!audio) {
      return
    }

    if (!audio.paused) {
      audio.pause()

      audio.currentTime = 0

      setSpeaking(false)

      return
    }

    try {
      audio.currentTime = 0

      await audio.play()

      setAutoplayBlocked(
        false,
      )
    } catch {
      setAutoplayBlocked(
        true,
      )
    }
  }


  // =========================================================
  // NAVIGATION
  // =========================================================

  function openPage(
    href: string,
  ) {
    if (leaving) {
      return
    }

    const audio =
      audioRef.current

    if (audio) {
      audio.pause()
    }

    setLeaving(true)

    window.setTimeout(
      () => {
        router.push(
          href,
        )
      },
      380,
    )
  }


  // =========================================================
  // SMALL DESKTOP PARALLAX
  // =========================================================

  function handlePointerMove(
    event:
      React.MouseEvent<HTMLElement>,
  ) {
    if (
      typeof window ===
        'undefined' ||
      window.innerWidth <= 900
    ) {
      return
    }

    const rect =
      event.currentTarget
        .getBoundingClientRect()

    const x =
      (
        event.clientX -
        rect.left -
        rect.width / 2
      ) /
      rect.width

    const y =
      (
        event.clientY -
        rect.top -
        rect.height / 2
      ) /
      rect.height

    setPointer({
      x,
      y,
    })
  }


  function resetPointer() {
    setPointer({
      x: 0,
      y: 0,
    })
  }


  return (
    <>
      {/* =====================================================
          STATIC FAST PRIYA AUDIO
      ====================================================== */}

      <audio
        ref={audioRef}
        src={WELCOME_AUDIO}
        preload="auto"

        onCanPlay={() => {
          setAudioReady(
            true,
          )
        }}

        onPlay={() => {
          setSpeaking(
            true,
          )
        }}

        onPause={() => {
          setSpeaking(
            false,
          )
        }}

        onEnded={() => {
          setSpeaking(
            false,
          )
        }}
      />


      {/* =====================================================
          INTRO
      ====================================================== */}

      <AnimatePresence>
        {loading && (
          <motion.div
            className="tk-intro"

            initial={{
              opacity: 1,
            }}

            exit={{
              opacity: 0,
            }}

            transition={{
              duration: 0.35,
            }}
          >
            <motion.div
              className="tk-intro-content"

              initial={{
                opacity: 0,
                scale: 0.92,
                y: 12,
              }}

              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}

              transition={{
                duration: 0.4,
                ease: 'easeOut',
              }}
            >
              <TalkoraLogo
                className="tk-intro-logo"
                priority
              />

              <div className="tk-intro-copy">
                Speak • Learn • Shine
              </div>

              <div className="tk-intro-loader">
                <motion.span
                  initial={{
                    width: '0%',
                  }}

                  animate={{
                    width: '100%',
                  }}

                  transition={{
                    duration: 0.62,
                    ease: 'easeOut',
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* =====================================================
          PAGE EXIT
      ====================================================== */}

      <AnimatePresence>
        {leaving && (
          <motion.div
            className="tk-exit"

            initial={{
              opacity: 0,
            }}

            animate={{
              opacity: 1,
            }}

            transition={{
              duration: 0.3,
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9,
              }}

              animate={{
                opacity: 1,
                scale: 1,
              }}
            >
              <TalkoraLogo
                className="tk-exit-logo"
              />

              <p>
                Let&apos;s go!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* =====================================================
          PAGE
      ====================================================== */}

      <main
        className="talkora-landing"

        onMouseMove={
          handlePointerMove
        }

        onMouseLeave={
          resetPointer
        }
      >

        {/* ===================================================
            BACKGROUND
        ==================================================== */}

        <motion.div
          className="talkora-world"

          animate={
            reduceMotion
              ? undefined
              : {
                  x:
                    pointer.x *
                    -3,

                  y:
                    pointer.y *
                    -2,

                  scale: 1.006,
                }
          }

          transition={{
            type: 'spring',
            stiffness: 40,
            damping: 28,
          }}
        >
          <Image
            src="/assets/talkora-landing-world.png"

            alt="Talkora English learning world with Miss Julie and students"

            fill
            priority
            quality={95}

            sizes="100vw"

            className="talkora-world-image"
          />
        </motion.div>


        {/* ===================================================
            DARKEN ONLY WHERE UI EXISTS
        ==================================================== */}

        <div className="talkora-page-shade" />

        <div className="talkora-mobile-shade" />


        {/* ===================================================
            AMBIENT PARTICLES
        ==================================================== */}

        <FloatingLight
          className="light-one"
          delay={0}
        />

        <FloatingLight
          className="light-two"
          delay={0.9}
        />

        <FloatingLight
          className="light-three"
          delay={1.6}
        />


        {/* ===================================================
            HERO INTERFACE
        ==================================================== */}

        <section className="talkora-layout">

          <div
            className="talkora-character-space"
            aria-hidden="true"
          />


          <motion.div
            className="talkora-panel-wrap"

            initial={{
              opacity: 0,
              x: 40,
              scale: 0.97,
            }}

            animate={
              loading
                ? {
                    opacity: 0,
                  }
                : {
                    opacity: 1,
                    x: 0,
                    scale: 1,
                  }
            }

            transition={{
              duration: 0.68,
              delay: 0.05,
              ease:
                [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
            }}
          >

            <motion.div
              className="talkora-panel"

              animate={
                reduceMotion
                  ? undefined
                  : {
                      y: [
                        0,
                        -2,
                        0,
                      ],
                    }
              }

              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >

              {/* =============================================
                  TOP SMALL LABEL
              ============================================== */}

              <motion.div
                className="talkora-kicker"

                initial={{
                  opacity: 0,
                  y: 8,
                }}

                animate={
                  loading
                    ? {
                        opacity: 0,
                      }
                    : {
                        opacity: 1,
                        y: 0,
                      }
                }

                transition={{
                  delay: 0.75,
                }}
              >
                <Sparkles
                  size={15}
                />

                <span>
                  SPEAK • LEARN • GROW
                  WITH MISS JULIE
                </span>
              </motion.div>


              {/* =============================================
                  TALKORA LOGO
              ============================================== */}

              <motion.div
                className="talkora-logo-holder"

                initial={{
                  opacity: 0,
                  scale: 0.9,
                }}

                animate={
                  loading
                    ? {
                        opacity: 0,
                      }
                    : {
                        opacity: 1,
                        scale: 1,
                      }
                }

                transition={{
                  delay: 0.82,
                  duration: 0.45,
                }}
              >
                <TalkoraLogo
                  className="talkora-panel-logo"
                  priority
                />
              </motion.div>


              {/* =============================================
                  HEADING
              ============================================== */}

              <motion.div
                className="talkora-copy"

                initial={{
                  opacity: 0,
                  y: 14,
                }}

                animate={
                  loading
                    ? {
                        opacity: 0,
                      }
                    : {
                        opacity: 1,
                        y: 0,
                      }
                }

                transition={{
                  delay: 0.9,
                }}
              >
                <h1>
                  Your AI English
                  <br />

                  <span>
                    Speaking Adventure
                  </span>
                </h1>

                <p>
                  Speak with Miss Julie,
                  build confidence and
                  turn English practice
                  into an adventure.
                </p>
              </motion.div>


              {/* =============================================
                  PRIYA / JULIE VOICE
              ============================================== */}

              <motion.button
                type="button"

                className={`
                  talkora-voice
                  ${
                    speaking
                      ? 'is-speaking'
                      : ''
                  }
                `}

                onClick={
                  toggleVoice
                }

                initial={{
                  opacity: 0,
                  y: 12,
                }}

                animate={
                  loading
                    ? {
                        opacity: 0,
                      }
                    : {
                        opacity: 1,
                        y: 0,
                      }
                }

                transition={{
                  delay: 0.98,
                }}

                whileHover={{
                  y: -2,
                  scale: 1.01,
                }}

                whileTap={{
                  scale: 0.98,
                }}
              >
                <motion.span
                  className="talkora-voice-icon"

                  animate={
                    speaking
                      ? {
                          scale: [
                            1,
                            1.1,
                            1,
                          ],
                        }
                      : undefined
                  }

                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                  }}
                >
                  {speaking
                    ? (
                      <VolumeX
                        size={19}
                      />
                    )
                    : (
                      <Volume2
                        size={19}
                      />
                    )
                  }
                </motion.span>


                <span className="talkora-voice-copy">

                  <small>
                    MISS JULIE
                  </small>

                  <strong>
                    {
                      speaking
                        ? 'Julie is speaking...'

                        : autoplayBlocked
                          ? 'Tap to hear Julie'

                          : audioReady
                            ? 'Hear my welcome'

                            : 'Getting ready...'
                    }
                  </strong>

                </span>


                {speaking && (
                  <VoiceBars />
                )}

              </motion.button>


              {/* =============================================
                  ACTION BUTTONS
              ============================================== */}

              <motion.div
                className="talkora-actions"

                initial={{
                  opacity: 0,
                  y: 14,
                }}

                animate={
                  loading
                    ? {
                        opacity: 0,
                      }
                    : {
                        opacity: 1,
                        y: 0,
                      }
                }

                transition={{
                  delay: 1.06,
                }}
              >

                <motion.button
                  type="button"

                  className="talkora-start"

                  onClick={() =>
                    openPage(
                      '/login/student',
                    )
                  }

                  whileHover={{
                    y: -3,
                    scale: 1.01,
                  }}

                  whileTap={{
                    y: 3,
                    scale: 0.98,
                  }}
                >
                  <span>
                    Start Journey
                  </span>

                  <ArrowRight
                    size={21}
                  />
                </motion.button>


                <motion.button
                  type="button"

                  className="talkora-school"

                  onClick={() =>
                    openPage(
                      '/login',
                    )
                  }

                  whileHover={{
                    y: -3,
                    scale: 1.01,
                  }}

                  whileTap={{
                    y: 3,
                    scale: 0.98,
                  }}
                >
                  <span className="talkora-school-icon">
                    <School
                      size={19}
                    />
                  </span>

                  <span className="talkora-school-copy">
                    <small>
                      GROWN-UPS
                    </small>

                    <strong>
                      Teacher / School
                    </strong>
                  </span>

                  <ArrowRight
                    size={16}
                  />
                </motion.button>

              </motion.div>


              {/* =============================================
                  FEATURES
              ============================================== */}

              <motion.div
                className="talkora-features"

                initial={{
                  opacity: 0,
                }}

                animate={
                  loading
                    ? {
                        opacity: 0,
                      }
                    : {
                        opacity: 1,
                      }
                }

                transition={{
                  delay: 1.14,
                }}
              >
                <span>
                  <Mic2
                    size={14}
                  />
                  Speak
                </span>

                <span>
                  <Sparkles
                    size={14}
                  />
                  Learn
                </span>

                <span>
                  <BookOpen
                    size={14}
                  />
                  Explore
                </span>
              </motion.div>

            </motion.div>

          </motion.div>

        </section>


        {/* ===================================================
            CSS
        ==================================================== */}

        <style jsx global>{`

          * {
            box-sizing:
              border-box;
          }


          html,
          body {
            margin: 0;

            width: 100%;
            min-height: 100%;
          }


          body {
            overflow: hidden;
          }


          button {
            font: inherit;
          }


          /* =================================================
             ROOT
          ================================================= */

          .talkora-landing {
            position: relative;

            width: 100vw;
            height: 100dvh;

            min-height: 600px;

            overflow: hidden;

            isolation: isolate;

            background:
              #071629;
          }


          /* =================================================
             BACKGROUND
          ================================================= */

          .talkora-world {
            position: absolute;

            inset: -5px;

            z-index: 0;
          }


          .talkora-world-image {
            object-fit:
              cover !important;

            object-position:
              center center !important;
          }


          /*
           * Desktop:
           *
           * Characters stay left.
           * Right side stays available for login panel.
           */

          .talkora-page-shade {
            position: absolute;

            inset: 0;

            z-index: 1;

            pointer-events: none;

            background:
              linear-gradient(
                90deg,

                rgba(
                  2,
                  8,
                  17,
                  0.03
                )
                0%,

                rgba(
                  2,
                  8,
                  17,
                  0.02
                )
                42%,

                rgba(
                  3,
                  11,
                  26,
                  0.08
                )
                54%,

                rgba(
                  3,
                  11,
                  26,
                  0.36
                )
                77%,

                rgba(
                  3,
                  10,
                  23,
                  0.58
                )
                100%
              );
          }


          .talkora-mobile-shade {
            display: none;
          }


          /* =================================================
             DESKTOP LAYOUT
          ================================================= */

          .talkora-layout {
            position: relative;

            z-index: 10;

            width:
              min(
                1560px,
                calc(
                  100vw -
                  48px
                )
              );

            height: 100%;

            margin:
              0 auto;

            display: grid;

            /*
             * LEFT = Julie & students
             * RIGHT = larger UI
             */

            grid-template-columns:
              minmax(
                0,
                54%
              )
              minmax(
                480px,
                46%
              );

            align-items:
              center;

            gap: 0;

            padding:
              24px 0;
          }


          .talkora-character-space {
            width: 100%;
            height: 100%;
          }


          .talkora-panel-wrap {
            /*
             * Pull UI LEFT so it sits closer
             * to Julie rather than hugging
             * the far-right screen edge.
             */

            justify-self:
              start;

            width:
              min(
                550px,
                100%
              );

            margin-left:
              clamp(
                45px,
                -2vw,
                -12px
              );
          }


          /* =================================================
             PANEL
          ================================================= */

          .talkora-panel {
            width: 100%;

            padding:
              clamp(
                24px,
                2.2vw,
                35px
              );

            border:
              1px solid
              rgba(
                255,
                255,
                255,
                0.14
              );

            border-radius:
              30px;

            background:
              linear-gradient(
                145deg,

                rgba(
                  10,
                  29,
                  54,
                  0.91
                ),

                rgba(
                  4,
                  17,
                  37,
                  0.88
                )
              );

            -webkit-backdrop-filter:
              blur(18px);

            backdrop-filter:
              blur(18px);

            box-shadow:
              0
              35px
              90px
              rgba(
                0,
                0,
                0,
                0.35
              ),

              inset
              0
              1px
              0
              rgba(
                255,
                255,
                255,
                0.11
              );
          }


          /* =================================================
             KICKER
          ================================================= */

          .talkora-kicker {
            display: flex;

            align-items: center;

            gap: 8px;

            color:
              #58ddff;

            font-size:
              10px;

            line-height:
              1.35;

            letter-spacing:
              0.09em;

            font-weight:
              950;
          }


          /* =================================================
             LOGO
          ================================================= */

          .talkora-logo-holder {
            display: flex;

            align-items: center;
            justify-content: center;

            margin:
              13px 0 4px;
          }


          .talkora-panel-logo {
            width:
              min(
                275px,
                75%
              );

            height: auto;
          }


          /* =================================================
             COPY
          ================================================= */

          .talkora-copy h1 {
            margin:
              10px 0 0;

            color:
              white;

            font-size:
              clamp(
                32px,
                2.5vw,
                43px
              );

            line-height:
              0.98;

            letter-spacing:
              -0.045em;

            font-weight:
              1000;
          }


          .talkora-copy h1 span {
            color:
              #59ddff;
          }


          .talkora-copy p {
            max-width:
              470px;

            margin:
              15px 0 0;

            color:
              rgba(
                255,
                255,
                255,
                0.83
              );

            font-size:
              13px;

            line-height:
              1.58;

            font-weight:
              650;
          }


          /* =================================================
             JULIE VOICE
          ================================================= */

          .talkora-voice {
            width: 100%;

            min-height:
              57px;

            margin-top:
              18px;

            padding:
              7px 13px
              7px 8px;

            display: flex;

            align-items:
              center;

            gap: 11px;

            border:
              1px solid
              rgba(
                88,
                220,
                255,
                0.24
              );

            border-radius:
              17px;

            color:
              white;

            background:
              linear-gradient(
                90deg,

                rgba(
                  33,
                  105,
                  146,
                  0.27
                ),

                rgba(
                  19,
                  67,
                  105,
                  0.2
                )
              );

            cursor: pointer;

            transition:
              background
                180ms ease,
              border-color
                180ms ease;
          }


          .talkora-voice:hover,
          .talkora-voice.is-speaking {
            border-color:
              rgba(
                98,
                230,
                255,
                0.52
              );

            background:
              linear-gradient(
                90deg,

                rgba(
                  36,
                  132,
                  177,
                  0.36
                ),

                rgba(
                  22,
                  79,
                  118,
                  0.27
                )
              );
          }


          .talkora-voice-icon {
            width: 41px;
            height: 41px;

            flex: 0 0 auto;

            display: grid;

            place-items:
              center;

            border-radius:
              13px;

            color:
              #68e4ff;

            background:
              rgba(
                77,
                204,
                255,
                0.15
              );
          }


          .talkora-voice-copy {
            min-width: 0;

            flex: 1;

            display: flex;

            flex-direction:
              column;

            align-items:
              flex-start;
          }


          .talkora-voice-copy small {
            color:
              #63dcff;

            font-size:
              7px;

            line-height: 1;

            letter-spacing:
              0.15em;

            font-weight:
              1000;
          }


          .talkora-voice-copy strong {
            margin-top:
              4px;

            font-size:
              11px;

            line-height:
              1.15;

            font-weight:
              900;
          }


          /* =================================================
             VOICE BARS
          ================================================= */

          .talkora-wave {
            height: 28px;

            display: flex;

            align-items: center;

            gap: 3px;

            flex: 0 0 auto;
          }


          .talkora-wave span {
            width: 3px;

            display: block;

            border-radius:
              999px;

            background:
              #61e0ff;
          }


          /* =================================================
             BUTTONS
          ================================================= */

          .talkora-actions {
            display: grid;

            grid-template-columns:
              1.05fr
              0.95fr;

            gap: 12px;

            margin-top:
              17px;
          }


          .talkora-start {
            min-height:
              62px;

            padding:
              0 20px;

            display: flex;

            align-items:
              center;

            justify-content:
              space-between;

            gap: 12px;

            border: 0;

            border-radius:
              18px;

            color:
              #151c26;

            background:
              linear-gradient(
                180deg,
                #ffdc4f,
                #ffb715
              );

            box-shadow:
              0
              6px
              0
              #d18b00,

              0
              15px
              27px
              rgba(
                0,
                0,
                0,
                0.17
              );

            cursor: pointer;

            font-size:
              13px;

            font-weight:
              1000;
          }


          .talkora-school {
            min-height:
              62px;

            padding:
              7px 12px
              7px 8px;

            display: flex;

            align-items:
              center;

            gap: 9px;

            border:
              1px solid
              rgba(
                94,
                178,
                255,
                0.23
              );

            border-radius:
              18px;

            color:
              white;

            background:
              linear-gradient(
                145deg,

                rgba(
                  9,
                  42,
                  82,
                  0.98
                ),

                rgba(
                  4,
                  23,
                  51,
                  0.98
                )
              );

            box-shadow:
              0
              6px
              0
              rgba(
                2,
                12,
                30,
                0.94
              );

            cursor: pointer;
          }


          .talkora-school-icon {
            width: 40px;
            height: 40px;

            flex: 0 0 auto;

            display: grid;

            place-items:
              center;

            border-radius:
              12px;

            color:
              #72ddff;

            background:
              rgba(
                62,
                187,
                255,
                0.12
              );
          }


          .talkora-school-copy {
            min-width: 0;

            flex: 1;

            display: flex;

            flex-direction:
              column;

            align-items:
              flex-start;
          }


          .talkora-school-copy small {
            color:
              #6ddaff;

            font-size:
              6px;

            letter-spacing:
              0.12em;

            font-weight:
              1000;
          }


          .talkora-school-copy strong {
            margin-top:
              2px;

            font-size:
              9px;

            white-space:
              nowrap;

            font-weight:
              950;
          }


          /* =================================================
             FEATURES
          ================================================= */

          .talkora-features {
            margin-top:
              25px;

            display: flex;

            align-items:
              center;

            justify-content:
              space-between;

            gap: 12px;

            color:
              rgba(
                255,
                255,
                255,
                0.65
              );

            font-size:
              9px;

            font-weight:
              850;
          }


          .talkora-features span {
            display: inline-flex;

            align-items:
              center;

            gap: 5px;
          }


          /* =================================================
             PARTICLES
          ================================================= */

          .talkora-light {
            position: absolute;

            z-index: 5;

            width: 6px;
            height: 6px;

            border-radius:
              999px;

            background:
              #ffe361;

            box-shadow:
              0
              0
              15px
              #ffe361;

            pointer-events:
              none;
          }


          .light-one {
            left: 48%;
            top: 19%;
          }


          .light-two {
            left: 53%;
            top: 64%;
          }


          .light-three {
            right: 6%;
            top: 28%;
          }


          /* =================================================
             INTRO
          ================================================= */

          .tk-intro {
            position: fixed;

            inset: 0;

            z-index: 9999;

            display: grid;

            place-items:
              center;

            background:
              radial-gradient(
                circle
                at
                50%
                45%,

                #164a76,

                #07182f
                53%,

                #020813
              );
          }


          .tk-intro-content {
            text-align: center;
          }


          .tk-intro-logo {
            width:
              min(
                240px,
                68vw
              );
          }


          .tk-intro-copy {
            margin-top:
              10px;

            color:
              rgba(
                255,
                255,
                255,
                0.78
              );

            font-size:
              10px;

            letter-spacing:
              0.08em;

            font-weight:
              900;
          }


          .tk-intro-loader {
            width: 200px;
            height: 5px;

            margin:
              16px auto
              0;

            overflow: hidden;

            border-radius:
              999px;

            background:
              rgba(
                255,
                255,
                255,
                0.08
              );
          }


          .tk-intro-loader span {
            display: block;

            height: 100%;

            border-radius:
              inherit;

            background:
              linear-gradient(
                90deg,

                #59dfff,

                #a479ff,

                #ffe05a
              );
          }


          /* =================================================
             EXIT
          ================================================= */

          .tk-exit {
            position: fixed;

            inset: 0;

            z-index: 9998;

            display: grid;

            place-items:
              center;

            text-align: center;

            background:
              radial-gradient(
                circle,

                #164673,

                #07152b
                60%,

                #020814
              );
          }


          .tk-exit-logo {
            width: 210px;
          }


          .tk-exit p {
            color:
              #ffe05b;

            font-weight:
              950;
          }


          /* =================================================
             SHORTER LAPTOP SCREENS
          ================================================= */

          @media (
            max-height: 780px
          )
          and
          (
            min-width: 901px
          ) {

            .talkora-layout {
              padding:
                14px 0;
            }


            .talkora-panel {
              padding:
                21px 25px;
            }


            .talkora-panel-logo {
              width:
                220px;
            }


            .talkora-copy h1 {
              font-size:
                clamp(
                  29px,
                  2.15vw,
                  37px
                );
            }


            .talkora-copy p {
              margin-top:
                10px;
            }


            .talkora-voice {
              margin-top:
                12px;
            }


            .talkora-actions {
              margin-top:
                12px;
            }


            .talkora-features {
              margin-top:
                18px;
            }
          }


          /* =================================================
             MEDIUM LAPTOP
          ================================================= */

          @media (
            max-width: 1250px
          )
          and
          (
            min-width: 901px
          ) {

            .talkora-layout {
              width:
                calc(
                  100vw -
                  30px
                );

              grid-template-columns:
                minmax(
                  0,
                  52%
                )
                minmax(
                  440px,
                  48%
                );
            }


            .talkora-panel-wrap {
              width:
                min(
                  510px,
                  100%
                );

              margin-left:
                -22px;
            }


            .talkora-panel {
              padding:
                25px;
            }

          }


          /* =================================================
             TABLET
          ================================================= */

          @media (
            max-width: 900px
          ) {

            body {
              overflow:
                auto;
            }


            .talkora-landing {
              min-height:
                100svh;

              height:
                100svh;
            }


            /*
             * LANDSCAPE SOURCE IMAGE
             *
             * On portrait devices it CANNOT show the
             * complete 16:9 artwork and still fill the
             * entire phone without empty bars.
             *
             * We deliberately crop the RIGHT side and
             * preserve Julie + students.
             */

            .talkora-world-image {
              object-fit:
                cover !important;

              object-position:
                25% center !important;
            }


            .talkora-page-shade {
              display: none;
            }


            .talkora-mobile-shade {
              position: absolute;

              inset: 0;

              z-index: 1;

              display: block;

              pointer-events:
                none;

              background:
                linear-gradient(
                  180deg,

                  rgba(
                    2,
                    9,
                    20,
                    0.01
                  )
                  0%,

                  rgba(
                    2,
                    9,
                    20,
                    0.02
                  )
                  38%,

                  rgba(
                    2,
                    10,
                    23,
                    0.34
                  )
                  52%,

                  rgba(
                    2,
                    10,
                    24,
                    0.89
                  )
                  100%
                );
            }


            .talkora-layout {
              width: 100%;

              height: 100%;

              display: flex;

              flex-direction:
                column;

              justify-content:
                flex-end;

              padding:
                12px;
            }


            .talkora-character-space {
              display: none;
            }


            .talkora-panel-wrap {
              width:
                min(
                  100%,
                  560px
                );

              margin:
                0 auto;

              justify-self:
                auto;
            }


            .talkora-panel {
              padding:
                20px;

              border-radius:
                24px;

              background:
                linear-gradient(
                  150deg,

                  rgba(
                    8,
                    28,
                    52,
                    0.89
                  ),

                  rgba(
                    4,
                    17,
                    36,
                    0.94
                  )
                );

              box-shadow:
                0
                20px
                55px
                rgba(
                  0,
                  0,
                  0,
                  0.32
                );
            }


            /*
             * Hide duplicate big logo on phone.
             *
             * The world artwork already includes
             * the Talkora board/logo.
             *
             * Gives children more image space.
             */

            .talkora-logo-holder {
              display: none;
            }


            .talkora-kicker {
              font-size:
                8px;
            }


            .talkora-copy h1 {
              margin-top:
                8px;

              font-size:
                clamp(
                  28px,
                  7vw,
                  36px
                );
            }


            .talkora-copy p {
              margin-top:
                8px;

              max-width:
                none;

              font-size:
                11px;

              line-height:
                1.42;
            }


            .talkora-voice {
              min-height:
                49px;

              margin-top:
                11px;
            }


            .talkora-actions {
              margin-top:
                11px;
            }


            .talkora-start,
            .talkora-school {
              min-height:
                54px;
            }


            .talkora-features {
              margin-top:
                15px;
            }


            .light-three {
              display: none;
            }
          }


          /* =================================================
             MOBILE
          ================================================= */

          @media (
            max-width: 600px
          ) {

            .talkora-world-image {
              /*
               * Keeps Julie's face,
               * boy and girl visible.
               */

              object-position:
                22% center !important;
            }


            .talkora-layout {
              padding:
                10px;
            }


            .talkora-panel-wrap {
              width: 100%;
            }


            .talkora-panel {
              padding:
                16px;

              border-radius:
                22px;
            }


            .talkora-kicker {
              justify-content:
                center;

              text-align:
                center;

              font-size:
                7px;
            }


            .talkora-copy {
              text-align:
                center;
            }


            .talkora-copy h1 {
              font-size:
                clamp(
                  26px,
                  8.3vw,
                  34px
                );
            }


            .talkora-copy p {
              max-width:
                380px;

              margin-left:
                auto;

              margin-right:
                auto;
            }


            .talkora-voice {
              max-width:
                430px;

              margin-left:
                auto;

              margin-right:
                auto;
            }


            .talkora-actions {
              grid-template-columns:
                1fr;

              max-width:
                430px;

              margin-left:
                auto;

              margin-right:
                auto;
            }


            .talkora-start,
            .talkora-school {
              width: 100%;
            }


            .talkora-features {
              justify-content:
                center;

              gap:
                20px;

              font-size:
                8px;
            }
          }


          /* =================================================
             SHORT PHONE — e.g. landscape / smaller viewport
          ================================================= */

          @media (
            max-width: 600px
          )
          and
          (
            max-height: 760px
          ) {

            .talkora-panel {
              padding:
                13px 15px;
            }


            .talkora-copy h1 {
              font-size:
                25px;
            }


            .talkora-copy p {
              display: none;
            }


            .talkora-voice {
              margin-top:
                9px;
            }


            .talkora-start,
            .talkora-school {
              min-height:
                49px;
            }


            .talkora-features {
              margin-top:
                12px;
            }
          }


          /* =================================================
             iPHONE PRO MAX / TALL MOBILE
          ================================================= */

          @media (
            max-width: 480px
          )
          and
          (
            min-height: 800px
          ) {

            /*
             * Give much more room to Julie.
             *
             * Panel stays in lower ~40%.
             */

            .talkora-panel {
              padding:
                16px 15px
                17px;
            }


            .talkora-copy h1 {
              font-size:
                29px;
            }


            .talkora-actions {
              gap: 9px;
            }


            .talkora-features {
              gap: 15px;
            }
          }


          /* =================================================
             REDUCED MOTION
          ================================================= */

          @media (
            prefers-reduced-motion:
              reduce
          ) {

            *,
            *::before,
            *::after {
              animation-duration:
                0.01ms !important;

              animation-iteration-count:
                1 !important;

              transition-duration:
                0.01ms !important;

              scroll-behavior:
                auto !important;
            }
          }

        `}</style>

      </main>
    </>
  )
}


// ============================================================
// DECORATIVE LIGHT
// ============================================================

function FloatingLight({
  className,
  delay,
}: {
  className: string
  delay: number
}) {
  return (
    <motion.span
      className={`
        talkora-light
        ${className}
      `}

      animate={{
        y: [
          0,
          -10,
          0,
        ],

        opacity: [
          0.2,
          1,
          0.2,
        ],

        scale: [
          0.7,
          1.25,
          0.7,
        ],
      }}

      transition={{
        duration: 3,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}


// ============================================================
// JULIE VOICE ANIMATION
// ============================================================

function VoiceBars() {
  return (
    <span className="talkora-wave">

      {[
        0,
        1,
        2,
        3,
        4,
      ].map(
        (index) => (
          <motion.span
            key={index}

            animate={{
              height: [
                5,
                17 +
                  (
                    index %
                    2
                  ) *
                  5,
                7,
                14,
                5,
              ],
            }}

            transition={{
              duration: 0.65,
              repeat: Infinity,
              ease: 'easeInOut',
              delay:
                index *
                0.06,
            }}
          />
        ),
      )}

    </span>
  )
}