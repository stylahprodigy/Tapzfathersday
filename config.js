/**
 * =========================================================================
 * FATHER'S DAY KEEPSAKE JOURNAL - ISLANDER & EDITORIAL CONFIGURATION
 * =========================================================================
 * Customize all text, captions, dates, and media here.
 */

window.JOURNAL_CONFIG = {
  // Passcode Gatekeeper (Set e.g. "DAD2026" or leave "" for immediate open)
  PASSCODE: "DAD2026", 

  // Main Identity & Heritage
  DAD_NAME: "Ratu Nautu Latunipulu",
  KEEPSAKE_TAG: "A FATHER'S DAY KEEPSAKE",
  TITLE: "The Journal of Him",
  SUBTITLE: "A living archive of the man who never asked to be remembered — and impossible to forget. What follows is a journey, page by page.",
  HERO_ACTION: "OPEN THE JOURNAL",
  YEAR: "2026",
  
  // Audio Ambience & Songs Playlist (Static for GitHub & Cloudflare Pages)
  AUDIO: {
    enabled: true,
    volume: 0.35,
    autoPlayAfterUnlock: true,
    playlist: [
      {
        title: "Maoli - Every Night Every Morning",
        url: "assets/songs/Maoli%20-%20%20every%20night%20every%20morning%20(%20lyrics)%20@MaoliMusic%20@VibeAndVerse-m4l.mp3"
      },
      {
        title: "Maoli - My Old Man ft. Fiji & Josh Tatofi",
        url: "assets/songs/Maoli%20-%20My%20Old%20Man%20ft.%20Fiji%20&%20Josh%20Tatofi%20(Official%20Lyric%20Video).mp3"
      }
    ]
  },

  // ENTRY I: THE EARLY YEARS
  ENTRY_1: {
    tag: "ENTRY I • THE EARLY YEARS",
    headline: "He lived in weather,",
    body: "Of all the things he was — builder, teacher, quiet comedian — he was first a man who simply showed up, season after season, to be where the day needed him. These are the years that taught the rest.",
    anchor: "ANCHORED IN 2001 • 2026",
    photo: {
      src: "assets/photos/IMG_9293.JPG",
      year: "2001",
      caption: "A LIFETIME OF INTEGRITY",
      alt: "Ratu Nautu Latunipulu - The Early Years"
    }
  },

  // ENTRY II: DEDICATION TO OUR PILLAR
  ENTRY_2: {
    tag: "ENTRY II • THE PILLAR & GUIDE",
    headline: "The Hands That Held Us",
    salutation: "Dear Dad,",
    body: [
      "Thank you for being our constant anchor, our loudest supporter, and the greatest example of what it means to lead with love, integrity, and strength.",
      "Every sacrifice you made, every lesson you taught, and every laugh we shared has shaped who we are today.",
      "This living archive is our tribute to your life, your heritage, and the priceless moments we carry in our hearts forever."
    ],
    signature: "With endless love & gratitude,",
    familySignoff: "— Your Family",
    tongaBadge: "KO E FONUA MO E 'OFA"
  },

  // ENTRY III: THE TIMELINE REEL ("a reel of the years")
  ENTRY_3: {
    tag: "ENTRY III • THE TIMELINE",
    headline: "a reel of the years",
    reels: [
      {
        year: "2009",
        title: "Two of Us",
        caption: "A photo taken too close, too bright, too fast — and therefore exactly right. This was how he loved: near enough to blur the edges, bright enough to make us squint. We kept it because it kept us.",
        src: "assets/photos/465111373_10225469986967151_7970654995887563673_n.jpg",
        align: "left"
      },
      {
        year: "2006",
        title: "Held, in the Light",
        caption: "Every good photograph of him is overexposed, as if the camera refused to hold a man that bright. She leaned in, the light came through the window, and the whole afternoon became a kind of grace.",
        src: "assets/photos/465172942_10225469988447188_1277699363661289478_n.jpg",
        align: "right"
      },
      {
        year: "2007",
        title: "The Glow Between Them",
        caption: "Two people who had learned, over years, to live in each other's light. The flare in the lens was only the sun doing what their faces had already done — refusing to let us tell where one ended and the other began.",
        src: "assets/photos/465367677_10225469988487189_8635519669333974068_n.jpg",
        align: "left"
      },
      {
        year: "2014",
        title: "What He Grew",
        caption: "Not crops, not wealth — people. A girl who learned to run in his shadow, a child who learned to sit on his shoulders. The tattoo told of where he'd been; the children told of where he stayed.",
        src: "assets/photos/465114369_10225469983567066_8602633835982269215_n.jpg",
        align: "right"
      }
    ]
  },

  // ENTRY IV: POLAROIDS ("a few polaroids, kept loose")
  ENTRY_4: {
    tag: "ENTRY IV • POLAROIDS",
    headline: "a few <em>polaroids</em>, kept loose",
    subtitle: "Memories that didn't ask to be framed, just remembered.",
    items: [
      {
        src: "assets/photos/IMG_1908.JPG",
        year: "2024",
        tilt: "-5deg"
      },
      {
        src: "assets/photos/IMG_2138.jpeg",
        year: "2023",
        tilt: "3deg"
      },
      {
        src: "assets/photos/IMG_5429.jpeg",
        year: "2022",
        tilt: "-4deg"
      },
      {
        src: "assets/photos/THAT_KINDA_GUY.JPG",
        year: "2021",
        tilt: "5deg"
      },
      {
        src: "assets/photos/464825450_10225438053368831_2504579000914362514_n.jpg",
        year: "2000",
        tilt: "-3deg"
      },
      {
        src: "assets/photos/465424263_10225469984807097_4500748773571450173_n.jpg",
        year: "2012",
        tilt: "4deg"
      },
      {
        src: "assets/photos/465288379_10225469987007152_6407773295642653158_n.jpg",
        year: "2009",
        tilt: "-2deg"
      },
      {
        src: "assets/photos/465173363_10225469982167031_3135516522095799177_n.jpg",
        year: "2005",
        tilt: "6deg"
      }
    ]
  },

  // ENTRY V: WORDS OF WISDOM & EPILOGUE
  ENTRY_5: {
    tag: "ENTRY V • WORDS OF WISDOM",
    headline: "Wisdom Carved in Calm Waters",
    quotes: [
      {
        quote: "“Work hard in silence, let your character and integrity do the talking.”",
        context: "DAILY LIFE LESSON"
      },
      {
        quote: "“No matter how stormy it gets, steady hands always find calm waters.”",
        context: "ON OVERCOMING CHALLENGES"
      },
      {
        quote: "“Family isn't just an important thing. It's everything.”",
        context: "CORE VALUE"
      }
    ],
    epilogue: {
      title: "A Toast to You, Dad!",
      badge: "HAPPY FATHER'S DAY",
      message: "May the years ahead bring you robust health, great joy, endless laughter, and many new adventures. We love you more than words can express.",
      toast: "Here's to the legend himself! 🥂"
    }
  }
};
