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
  
  // Audio Ambience & Songs Playlist
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
        year: "2005",
        title: "In the Sunshine",
        caption: "A photo taken in the warmth of the island afternoon. He smiled with that calm quiet certainty that made everyone around him feel safe and cherished.",
        src: "assets/photos/465422921_10225469982327035_8577979762292632392_n.jpg",
        align: "left"
      },
      {
        year: "2007",
        title: "Shared Laughs & Grace",
        caption: "Every good photograph of him carries that gentle light. She leaned in, the light came through the window, and the whole afternoon became a kind of grace.",
        src: "assets/photos/465561133_10225469980846998_5089765502435108626_n.jpg",
        align: "right"
      },
      {
        year: "2009",
        title: "The Glow Between Them",
        caption: "Two people who had learned, over years, to live in each other's light. The flare in the lens was only the sun doing what their faces had already done.",
        src: "assets/photos/465367677_10225469988487189_8635519669333974068_n.jpg",
        align: "left"
      },
      {
        year: "2014",
        title: "What He Grew",
        caption: "Not crops, not wealth — people. A family who learned to walk in his shadow and stand strong in his legacy. The children tell of where he stayed.",
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
      { src: "assets/photos/087B36B5-CD79-4039-AAF8-20489B585371.JPEG", year: "2025", title: "Family Celebration", tilt: "-4deg" },
      { src: "assets/photos/3C29833E-4E54-4C69-8893-3B2717615E94.JPG", year: "2024", title: "Quiet Reflection", tilt: "3deg" },
      { src: "assets/photos/461726255_10225072540511238_9061600720500740799_n.jpg", year: "2024", title: "Warm Smile", tilt: "-3deg" },
      { src: "assets/photos/464825450_10225438053368831_2504579000914362514_n.jpg", year: "2000", title: "The Pillar", tilt: "5deg" },
      { src: "assets/photos/465173363_10225469982167031_3135516522095799177_n.jpg", year: "2005", title: "Island Days", tilt: "-2deg" },
      { src: "assets/photos/465288379_10225469987007152_6407773295642653158_n.jpg", year: "2009", title: "Golden Afternoon", tilt: "4deg" },
      { src: "assets/photos/465424263_10225469984807097_4500748773571450173_n.jpg", year: "2012", title: "Family Moments", tilt: "-5deg" },
      { src: "assets/photos/54380C1A-045B-4651-9575-DE4F7B44CF30.JPEG", year: "2026", title: "Unforgettable Smile", tilt: "2deg" },
      { src: "assets/photos/56577D91-B720-4B0D-A6ED-92F5CC84309D.JPG", year: "2023", title: "Generations", tilt: "-3deg" },
      { src: "assets/photos/851F6047-DD43-4F68-86FD-72D0294A85D7.JPG", year: "2025", title: "Joyful Reunion", tilt: "4deg" },
      { src: "assets/photos/921AD708-742A-4A4E-A32E-CA81093D90DE.JPEG", year: "2024", title: "Warm Embrace", tilt: "-4deg" },
      { src: "assets/photos/AEC801CA-EFF9-4645-892E-586BEF9E4632.JPG", year: "2023", title: "Precious Memory", tilt: "3deg" },
      { src: "assets/photos/BBBECE25-968A-4821-8063-FA7A2776C0E1.JPEG", year: "2026", title: "Father's Legacy", tilt: "-2deg" },
      { src: "assets/photos/IMG_1908.JPG", year: "2024", title: "Cherished Moments", tilt: "5deg" },
      { src: "assets/photos/IMG_2138.jpeg", year: "2023", title: "Laughter & Joy", tilt: "-3deg" },
      { src: "assets/photos/IMG_3133.JPEG", year: "2025", title: "Special Gathering", tilt: "2deg" },
      { src: "assets/photos/IMG_3153.JPG", year: "2024", title: "Sunlit Smiles", tilt: "-4deg" },
      { src: "assets/photos/IMG_5429.jpeg", year: "2022", title: "Always Together", tilt: "3deg" },
      { src: "assets/photos/THAT_KINDA_GUY.JPG", year: "2021", title: "That Kinda Guy", tilt: "-2deg" }
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
