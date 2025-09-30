export type DomainKey = 'O' | 'C' | 'E' | 'A' | 'N';

export const VERSION = "gz-domainspec-1.3.0" as const;

export const DOMAINS: Record<DomainKey, { label: string; facets: string[] }> = {
  O: { label: "Openness (O)", facets: ["Imagination","Artistic Interests","Emotionality","Adventurousness","Intellect","Liberalism"] },
  C: { label: "Conscientiousness (C)", facets: ["Self-Efficacy","Orderliness","Dutifulness","Achievement-Striving","Self-Discipline","Cautiousness"] },
  E: { label: "Extraversion (E)", facets: ["Friendliness","Gregariousness","Assertiveness","Activity Level","Excitement-Seeking","Cheerfulness"] },
  A: { label: "Agreeableness (A)", facets: ["Trust","Morality","Altruism","Cooperation","Modesty","Sympathy"] },
  N: { label: "Neuroticism (N)", facets: ["Anxiety","Anger","Depression","Self-Consciousness","Immoderation","Vulnerability"] }
};

export const DOMAIN_DESCRIPTIONS: Record<DomainKey, any> = {
  O: {
    shortDescription: "Openness to Experience describes a dimension of cognitive style that distinguishes imaginative, creative people from down-to-earth, conventional people.",
    fullDescription: "Open people are intellectually curious, appreciative of art, and sensitive to beauty. They tend to be, compared to closed people, more aware of their feelings. They tend to think and act in individualistic and nonconforming ways. Intellectuals typically score high on Openness to Experience; consequently, this factor has also been called Culture or Intellect. Nonetheless, Intellect is probably best regarded as one aspect of openness to experience. Scores on Openness to Experience are only modestly related to years of education and scores on standard intelligent tests. Another characteristic of the open cognitive style is a facility for thinking in symbols and abstractions far removed from concrete experience. Depending on the individual's specific intellectual abilities, this symbolic cognition may take the form of mathematical, logical, or geometric thinking, artistic and metaphorical use of language, music composition or performance, or one of the many visual or performing arts. People with low scores on openness to experience tend to have narrow, common interests. They prefer the plain, straightforward, and obvious over the complex, ambiguous, and subtle. They may regard the arts and sciences with suspicion, regarding these endeavors as abstruse or of no practical use. Closed people prefer familiarity over novelty; they are conservative and resistant to change. Openness is often presented as healthier or more mature by psychologists, who are often themselves open to experience. However, open and closed styles of thinking are useful in different environments. The intellectual style of the open person may serve a professor well, but research has shown that closed thinking is related to superior job performance in police work, sales, and a number of service occupations.",
    results: {
      low: "Your score on Openness to Experience is low, indicating you like to think in plain and simple terms. Others describe you as down-to-earth, practical, and conservative.",
      neutral: "Your score on Openness to Experience is average, indicating you enjoy tradition but are willing to try new things. Your thinking is neither simple nor complex. To others you appear to be a well-educated person but not an intellectual.",
      high: "Your score on Openness to Experience is high, indicating you enjoy novelty, variety, and change. You are curious, imaginative, and creative."
    }
  },
  C: {
    shortDescription: "Conscientiousness concerns the way in which we control, regulate, and direct our impulses.",
    fullDescription: "Impulses are not inherently bad; occasionally time constraints require a snap decision, and acting on our first impulse can be an effective response. Also, in times of play rather than work, acting spontaneously and impulsively can be fun. Impulsive individuals can be seen by others as colorful, fun-to-be-with, and zany. Nonetheless, acting on impulse can lead to trouble in a number of ways. Some impulses are antisocial. Uncontrolled antisocial acts not only harm other members of society, but also can result in retribution toward the perpetrator of such impulsive acts. Another problem with impulsive acts is that they often produce immediate rewards but undesirable, long-term consequences. Examples include excessive socializing that leads to being fired from one's job, hurling an insult that causes the breakup of an important relationship, or using pleasure-inducing drugs that eventually destroy one's health. Impulsive behavior, even when not seriously destructive, diminishes a person's effectiveness in significant ways. Acting impulsively disallows contemplating alternative courses of action, some of which would have been wiser than the impulsive choice. Impulsivity also sidetracks people during projects that require organized sequences of steps or stages. Accomplishments of an impulsive person are therefore small, scattered, and inconsistent. A hallmark of intelligence, what potentially separates human beings from earlier life forms, is the ability to think about future consequences before acting on an impulse. Intelligent activity involves contemplation of long-range goals, organizing and planning routes to these goals, and persisting toward one's goals in the face of short-lived impulses to the contrary. The idea that intelligence involves impulse control is nicely captured by the term prudence, an alternative label for the Conscientiousness domain. Prudent means both wise and cautious. Persons who score high on the Conscientiousness scale are, in fact, perceived by others as intelligent. The benefits of high conscientiousness are obvious. Conscientious individuals avoid trouble and achieve high levels of success through purposeful planning and persistence. They are also positively regarded by others as intelligent and reliable. On the negative side, they can be compulsive perfectionists and workaholics. Furthermore, extremely conscientious individuals might be regarded as stuffy and boring. Unconscientious people may be criticized for their unreliability, lack of ambition, and failure to stay within the lines, but they will experience many short-lived pleasures and they will never be called stuffy.",
    results: {
      low: "Your score on Conscientiousness is low, indicating you like to live for the moment and do what feels good now. Your work tends to be careless and disorganized.",
      neutral: "Your score on Conscientiousness is average. This means you are reasonably reliable, organized, and self-controlled.",
      high: "Your score on Conscientiousness is high. This means you set clear goals and pursue them with determination. People regard you as reliable and hard-working."
    }
  },
  E: {
    shortDescription: "Extraversion is marked by pronounced engagement with the external world.",
    fullDescription: "Extraverts enjoy being with people, are full of energy, and often experience positive emotions. They tend to be enthusiastic, action-oriented, individuals who are likely to say \"Yes!\" or \"Let's go!\" to opportunities for excitement. In groups they like to talk, assert themselves, and draw attention to themselves. Introverts lack the exuberance, energy, and activity levels of extraverts. They tend to be quiet, low-key, deliberate, and disengaged from the social world. Their lack of social involvement should not be interpreted as shyness or depression; the introvert simply needs less stimulation than an extravert and prefers to be alone. The independence and reserve of the introvert is sometimes mistaken as unfriendliness or arrogance. In reality, an introvert who scores high on the agreeableness dimension will not seek others out but will be quite pleasant when approached.",
    results: {
      low: "Your score on Extraversion is low, indicating you are introverted, reserved, and quiet. You enjoy solitude and solitary activities. Your socialization tends to be restricted to a few close friends.",
      neutral: "Your score on Extraversion is average, indicating you are neither a subdued loner nor a jovial chatterbox. You enjoy time with others but also time alone.",
      high: "Your score on Extraversion is high, indicating you are sociable, outgoing, energetic, and lively. You prefer to be around people much of the time."
    }
  },
  A: {
    shortDescription: "Agreeableness reflects individual differences in concern with cooperation and social harmony. Agreeable individuals value getting along with others.",
    fullDescription: "They are therefore considerate, friendly, generous, helpful, and willing to compromise their interests with others'. Agreeable people also have an optimistic view of human nature. They believe people are basically honest, decent, and trustworthy. Disagreeable individuals place self-interest above getting along with others. They are generally unconcerned with others' well-being, and therefore are unlikely to extend themselves for other people. Sometimes their skepticism about others' motives causes them to be suspicious, unfriendly, and uncooperative. Agreeableness is obviously advantageous for attaining and maintaining popularity. Agreeable people are better liked than disagreeable people. On the other hand, agreeableness is not useful in situations that require tough or absolute objective decisions. Disagreeable people can make excellent scientists, critics, or soldiers.",
    results: {
      low: "Your score on Agreeableness is low, indicating less concern with others' needs than with your own. People see you as tough, critical, and uncompromising.",
      neutral: "Your level of Agreeableness is average, indicating some concern with others' Needs, but, generally, unwillingness to sacrifice yourself for others.",
      high: "Your high level of Agreeableness indicates a strong interest in others' needs and well-being. You are pleasant, sympathetic, and cooperative."
    }
  },
  N: {
    shortDescription: "Neuroticism refers to the tendency to experience negative feelings.",
    fullDescription: "Freud originally used the term neurosis to describe a condition marked by mental distress, emotional suffering, and an inability to cope effectively with the normal demands of life. He suggested that everyone shows some signs of neurosis, but that we differ in our degree of suffering and our specific symptoms of distress. Today neuroticism refers to the tendency to experience negative feelings. Those who score high on Neuroticism may experience primarily one specific negative feeling such as anxiety, anger, or depression, but are likely to experience several of these emotions. People high in neuroticism are emotionally reactive. They respond emotionally to events that would not affect most people, and their reactions tend to be more intense than normal. They are more likely to interpret ordinary situations as threatening, and minor frustrations as hopelessly difficult. Their negative emotional reactions tend to persist for unusually long periods of time, which means they are often in a bad mood. These problems in emotional regulation can diminish a neurotic's ability to think clearly, make decisions, and cope effectively with stress.",
    results: {
      low: "Your score on Neuroticism is low, indicating that you are exceptionally calm, composed and unflappable. You do not react with intense emotions, even to situations that most people would describe as stressful.",
      neutral: "Your score on Neuroticism is average, indicating that your level of emotional reactivity is typical of the general population. Stressful and frustrating situations are somewhat upsetting to you, but you are generally able to get over these feelings and cope with these situations.",
      high: "Your score on Neuroticism is high, indicating that you are easily upset, even by what most people consider the normal demands of living. People consider you to be sensitive and emotional."
    }
  }
};

export const FACET_DESCRIPTIONS: Record<DomainKey, Record<string, string>> = {
  O: {
    "Imagination": "This measures how much you use fantasy and imagination in daily life.",
    "Artistic Interests": "This measures your appreciation for beauty in art and nature.",
    "Emotionality": "This measures your awareness and expression of emotions.",
    "Adventurousness": "This measures your openness to new experiences and change.",
    "Intellect": "This measures your interest in abstract ideas and intellectual pursuits.",
    "Liberalism": "This measures your openness to challenging traditional values and authority."
  },
  C: {
    "Self-Efficacy": "This measures your confidence in your ability to accomplish things.",
    "Orderliness": "This measures how organized and structured you are in daily life.",
    "Dutifulness": "This measures your sense of moral obligation and duty.",
    "Achievement-Striving": "This measures your drive to excel and achieve success.",
    "Self-Discipline": "This measures your ability to persist at difficult tasks.",
    "Cautiousness": "This measures how carefully you think before acting."
  },
  E: {
    "Friendliness": "This measures how warmly you approach and connect with others.",
    "Gregariousness": "This measures how much you enjoy being in groups and crowds.",
    "Assertiveness": "This measures your tendency to take charge and speak up.",
    "Activity Level": "This measures how fast-paced and busy your daily life is.",
    "Excitement-Seeking": "This measures your need for stimulation and thrills.",
    "Cheerfulness": "This measures your positive mood and energy."
  },
  A: {
    "Trust": "This measures how much you believe others have good intentions.",
    "Morality": "This measures your tendency to be straightforward and honest in relationships.",
    "Altruism": "This measures how much you enjoy helping others without expecting returns.",
    "Cooperation": "This measures your willingness to compromise to maintain harmony.",
    "Modesty": "This measures how much you downplay your achievements.",
    "Sympathy": "This measures how much you feel moved by others' suffering."
  },
  N: {
    "Anxiety": "This measures how easily you feel worried or tense.",
    "Anger": "This measures how easily you feel irritated or enraged.",
    "Depression": "This measures your tendency to feel sad or discouraged.",
    "Self-Consciousness": "This measures how much you worry about others' judgments of you.",
    "Immoderation": "This measures how easily you resist temptations and cravings.",
    "Vulnerability": "This measures how well you cope under pressure and stress."
  }
};

export const FACET_INTERPRETATIONS: Record<DomainKey, Record<string, {high:string;medium:string;low:string}>> = {
  O: {
    "Imagination": {
      high: "You have an exceptionally rich inner world where fantasy and creativity flourish. You frequently use imaginative thinking to solve problems and enhance your daily experiences. Your mind naturally creates vivid mental scenarios and you find great pleasure in exploring imaginary worlds and possibilities.",
      medium: "You balance imaginative thinking with practical concerns. You can appreciate fantasy and creativity while staying grounded in reality. You use imagination when helpful but don't rely on it as your primary way of thinking.",
      low: "You strongly prefer to focus on facts, reality, and concrete information. Fantasy and imaginative thinking feel unnecessary or distracting to you. You value practical, straightforward approaches and find that staying grounded in reality serves you well."
    },
    "Artistic Interests": {
      high: "You have a deep appreciation for beauty in all its forms. You actively seek out artistic experiences and find great meaning in art, music, literature, and natural beauty. These experiences often move you deeply.",
      medium: "You can appreciate beauty and artistic expression when you encounter it, but you don't actively seek out these experiences. You enjoy some forms of art or music but aren't particularly driven to explore new artistic territories. You value aesthetics but it's not a central focus in your life.",
      low: "You have limited interest in artistic or aesthetic pursuits. You may find some forms of art pleasant but don't feel particularly moved by them. You prefer practical, functional things over purely aesthetic considerations."
    },
    "Emotionality": {
      high: "You have exceptional emotional awareness and sensitivity. You are deeply in touch with your feelings and those of others, using emotional intelligence as a primary guide in decision-making. You experience emotions intensely and are deeply affected by others' emotional states.",
      medium: "You have a good balance between emotional awareness and rational thinking. You can tune into your feelings when needed but also rely on logical analysis. You experience emotions normally but don't let them completely override your judgment.",
      low: "You tend to focus more on facts, logic, and practical considerations rather than emotional information. You may not be as aware of your own emotions or those of others, and you prefer to make decisions based on objective data rather than feelings."
    },
    "Adventurousness": {
      high: "You are a true adventurer who actively seeks out new experiences, places, and challenges. You thrive on variety and change, often feeling restless when stuck in routines. You love trying new foods, visiting new places, and exploring different ways of doing things. The unknown excites rather than frightens you.",
      medium: "You enjoy some new experiences but also value the comfort and predictability of familiar routines. You're willing to try new things when the opportunity arises, but you don't actively seek out constant change. You appreciate both stability and variety in your life.",
      low: "You strongly prefer familiar routines and established ways of doing things. Change makes you uncomfortable, and you find great comfort in predictability and stability. You prefer to stick with what you know works."
    },
    "Intellect": {
      high: "You have a deep love for intellectual pursuits and abstract thinking. You enjoy grappling with complex ideas, engaging in philosophical discussions, and exploring theoretical concepts. You find satisfaction in solving puzzles, debating intellectual issues, and learning about abstract topics. You appreciate the mental stimulation that comes from challenging intellectual work.",
      medium: "You can appreciate intellectual pursuits and enjoy some abstract thinking, but you also value practical, hands-on activities. You engage with complex ideas when they're relevant to your life or work, but you don't seek out purely theoretical discussions. You balance intellectual curiosity with practical concerns.",
      low: "You prefer dealing with concrete, practical matters rather than abstract ideas or theoretical concepts. You value hands-on experience and practical knowledge over intellectual discussions. You may find purely academic or theoretical topics uninteresting or irrelevant to your daily life."
    },
    "Liberalism": {
      high: "You naturally question traditional values, challenge established practices, and think critically about authority and convention. You enjoy exploring alternative viewpoints and are comfortable with ambiguity and change. You value individual freedom and self-expression over strict adherence to traditional norms.",
      medium: "You balance respect for tradition with openness to new ideas and change. You can appreciate both established ways of doing things and innovative approaches. You're willing to consider alternative viewpoints but also value the wisdom that comes from tradition.",
      low: "You strongly prefer established traditions and are resistant to challenging authority or conventional practices. You find comfort and security in familiar ways of doing things and may be suspicious of radical change or unconventional ideas. You value stability, tradition, and respect for authority."
    }
  },
  C: {
    "Self-Efficacy": {
      high: "You have exceptional confidence in your abilities and believe strongly in your capacity to handle challenges and achieve your goals. You approach difficult tasks with optimism and determination, trusting that you have the skills and resources needed to succeed. You feel in control of your life and believe that your efforts will lead to positive outcomes.",
      medium: "You have a balanced view of your abilities, feeling confident in some areas while experiencing self-doubt in others. You generally believe in your capacity to succeed but may need encouragement or evidence of past success to feel fully confident. You approach challenges with cautious optimism.",
      low: "You often doubt your effectiveness and feel less in control of your life. You may frequently question whether you have the ability to handle challenges or achieve your goals. You may feel that external factors have more control over your outcomes than your own efforts."
    },
    "Orderliness": {
      high: "You maintain an exceptionally organized lifestyle with clear routines, systems, and structures. You have a place for everything and everything in its place, and you find great satisfaction in maintaining order and cleanliness. You likely keep detailed schedules, maintain neat workspaces, and have established routines that help you stay productive and efficient.",
      medium: "You are somewhat organized but not rigid about structure. You appreciate order and cleanliness but can also adapt when things get a bit messy or when your routines are disrupted. You have some systems in place to help you stay organized, but you're not overly concerned if things don't go exactly according to plan.",
      low: "You tend to be disorganized and prefer a more flexible, spontaneous approach to life. You may find detailed schedules and rigid routines constraining, and you're comfortable with a certain amount of chaos or mess. You prefer to go with the flow rather than planning everything out."
    },
    "Dutifulness": {
      high: "You have an exceptionally strong sense of moral obligation and always follow through on your commitments. You take your responsibilities seriously and believe that keeping your word is fundamental to your character. You value integrity and reliability above convenience, and others can count on you to do what you say you'll do.",
      medium: "You generally keep your commitments and try to follow through on your obligations, but you sometimes find rules or expectations overly confining. You value responsibility and reliability, but you also recognize that sometimes flexibility is necessary. You may occasionally bend the rules or adjust your commitments when circumstances change.",
      low: "You find rules and obligations overly restrictive and prefer flexibility in your commitments and responsibilities. You may see many rules as unnecessary or arbitrary, and you're comfortable adjusting your commitments when your priorities or circumstances change. You value personal freedom and autonomy over strict adherence to obligations."
    },
    "Achievement-Striving": {
      high: "You are highly driven to achieve excellence and set ambitious goals for yourself. You push yourself to excel in everything you do and have a strong desire to be recognized as successful. You likely work long hours, take on challenging projects, and constantly seek ways to improve your performance. You find great satisfaction in your accomplishments and the recognition they bring.",
      medium: "You have a healthy drive to succeed but balance it with other important priorities in your life. You set reasonable goals for yourself and work hard to achieve them, but you also make time for relationships, hobbies, and personal well-being. You want to do well but don't feel the need to be the absolute best at everything.",
      low: "You are content with putting in minimal effort and don't feel particularly driven to excel or achieve great success. You prefer to take things at a comfortable pace and may see excessive ambition as unnecessary stress. You value work-life balance and personal satisfaction over external recognition or achievement."
    },
    "Self-Discipline": {
      high: "You have exceptional self-discipline and can persist through difficult tasks while effectively resisting distractions. You have strong willpower and can delay gratification to achieve long-term goals. You're able to maintain focus even when tasks are boring or challenging, and you rarely give in to temptations that might derail your progress.",
      medium: "You have moderate self-discipline and can usually stay focused on important tasks, but you sometimes struggle with distractions or procrastination. You can resist most temptations but may occasionally give in to immediate gratification. You generally complete your responsibilities but may need external motivation or deadlines to push through particularly challenging or unpleasant tasks.",
      low: "You often struggle with self-discipline and may frequently procrastinate or have difficulty completing challenging tasks. You may find it hard to resist temptations or distractions, and you might prefer immediate gratification over long-term rewards. You may need external structure, deadlines, or accountability to help you stay on track."
    },
    "Cautiousness": {
      high: "You are exceptionally careful and deliberate in your decision-making process, thoroughly considering all options and potential consequences before taking action. You prefer to gather extensive information, weigh pros and cons, and think through various scenarios before making important choices. You value careful planning and preparation over quick, impulsive actions.",
      medium: "You generally think things through before making important decisions, but you don't over-analyze every choice. You can balance careful consideration with the need to act in a timely manner. You gather enough information to feel confident in your decisions, but you also recognize that sometimes you need to move forward even when you don't have complete information.",
      low: "You tend to act on first impulses and make decisions quickly without extensive deliberation. You prefer to trust your instincts and move forward rather than getting bogged down in analysis. You may sometimes make decisions that you later regret, but you also value the ability to act quickly and adapt as needed."
    }
  },
  E: {
    "Friendliness": {
      high: "You are exceptionally warm and approachable, naturally drawing others to you with your genuine interest in people and your ability to make them feel comfortable. You easily form close, meaningful relationships and people often feel at ease around you. You have a gift for making others feel valued and understood, and you likely have a wide circle of friends and acquaintances who appreciate your warmth and sincerity.",
      medium: "You are friendly and approachable when others initiate contact, but you don't always take the first step in social situations. You can form meaningful relationships, but you may be more selective about who you let into your inner circle. You value quality over quantity in your relationships and prefer deeper connections with fewer people rather than many superficial relationships.",
      low: "You are more reserved and distant in your social interactions, preferring to keep others at arm's length. You may be seen as aloof or unapproachable, even though you may be perfectly friendly once people get to know you. You value your privacy and independence, and you may find extensive social interaction draining or unnecessary."
    },
    "Gregariousness": {
      high: "You are highly gregarious and actively seek out group activities and social stimulation. You thrive in the company of others and find large gatherings energizing rather than draining. You likely have a busy social calendar and enjoy being around people most of the time. You may feel restless or lonely when you're alone for too long, and you find that your energy and mood improve when you're in social settings.",
      medium: "You enjoy some group activities and social gatherings, but you also value and need time alone to recharge. You can be social when the situation calls for it, but you don't feel the need to be constantly surrounded by people. You appreciate both the stimulation of group activities and the peace and quiet of solitude, finding a balance that works for your personality and energy levels.",
      low: "You prefer smaller groups or solitude over large social gatherings, finding them overwhelming or draining rather than energizing. You may feel uncomfortable in large crowds and prefer intimate settings with close friends or family. You value your privacy and independence, and you may find that you need significant alone time to feel your best."
    },
    "Assertiveness": {
      high: "You are naturally assertive and comfortable taking charge in group situations. You speak up confidently to influence decisions and aren't afraid to voice your opinions, even when they differ from others. You likely find yourself in leadership roles and are comfortable directing others or taking responsibility for outcomes. You may sometimes be seen as dominant or pushy, but you're also respected for your ability to get things done and make tough decisions.",
      medium: "You can assert yourself when necessary, but you don't always feel the need to take charge or lead discussions. You're comfortable speaking up when you have something important to say, but you also value listening to others' perspectives. You can lead when the situation calls for it, but you're equally comfortable following others' lead when they have more expertise or experience in a particular area.",
      low: "You prefer to let others take control and avoid leading discussions or taking charge in group situations. You may feel uncomfortable being the center of attention or making decisions that affect others. You value harmony and may worry about upsetting others with your opinions. You're more comfortable supporting others' ideas and contributing quietly rather than taking a prominent leadership role."
    },
    "Activity Level": {
      high: "You maintain an exceptionally fast-paced, energetic lifestyle with many activities and commitments. You thrive on being busy and active, often juggling multiple projects, hobbies, and social engagements simultaneously. You may find it difficult to slow down or relax, and you often feel restless when you're not doing something productive or engaging.",
      medium: "You balance activity with rest, maintaining a moderate pace that works well for your energy levels and lifestyle. You enjoy being active and engaged, but you also recognize the importance of downtime and relaxation. You can handle busy periods when necessary, but you also appreciate quieter, more leisurely times.",
      low: "You prefer a slower, more leisurely pace with fewer activities and commitments. You value relaxation and downtime, and you may find constant activity overwhelming or exhausting. You enjoy taking your time with tasks and activities, and you're comfortable with a more relaxed, unhurried approach to life."
    },
    "Excitement-Seeking": {
      high: "You actively seek out thrilling experiences and enjoy taking risks that others might find too dangerous or extreme. You thrive on adrenaline and excitement, often feeling bored or restless when life becomes too predictable or routine. You may enjoy extreme sports, adventurous travel, or other high-stimulation activities that provide the excitement you crave. You're comfortable with uncertainty and may even find that you perform better under pressure or in high-stakes situations.",
      medium: "You enjoy some excitement and stimulation, but you also value stability and predictability in your life. You're willing to try new things and take calculated risks, but you avoid situations that feel too overwhelming or dangerous. You appreciate a balance between adventure and security, and you can enjoy both thrilling experiences and calm, peaceful moments.",
      low: "You prefer calm, predictable environments and avoid risky activities or situations that might cause stress or anxiety. You value stability and security over excitement and adventure, and you find comfort in routines and familiar experiences. You may find high-stimulation activities overwhelming or unpleasant, and you prefer to avoid situations that involve significant risk or uncertainty."
    },
    "Cheerfulness": {
      high: "You consistently display positive emotions and upbeat energy, naturally radiating optimism and enthusiasm that others find infectious. You have a sunny disposition and tend to see the bright side of situations, even during difficult times. You likely have a positive outlook on life and can find joy and humor in everyday experiences. Your cheerful nature often lifts the spirits of those around you.",
      medium: "You generally maintain a positive mood with normal fluctuations, experiencing both good and bad days like most people. You can be cheerful and optimistic when things are going well, but you also experience the full range of human emotions. You have a balanced perspective on life, appreciating the good times while also acknowledging that difficult periods are a normal part of the human experience.",
      low: "You are less prone to high spirits and maintain a more subdued, serious mood most of the time. You may not display the same level of enthusiasm or optimism as others, and you tend to be more reserved in your emotional expressions. You may find excessive cheerfulness or forced positivity uncomfortable or even annoying. You prefer a more realistic, measured approach to life."
    }
  },
  A: {
    "Trust": {
      high: "You have an exceptionally trusting nature and assume most people have good intentions, giving them the benefit of the doubt even when you don't have complete information about their motives. You believe in the fundamental goodness of people and are willing to trust others until they give you a reason not to. You may sometimes be taken advantage of because of your trusting nature, but you also experience the benefits of deep, meaningful relationships built on mutual trust and respect.",
      medium: "You are somewhat trusting but remain cautious in new situations, taking time to get to know people before fully trusting them. You can be open and trusting with people you know well, but you're more guarded with strangers or in unfamiliar situations. You value trust in relationships but also recognize the importance of being realistic about human nature.",
      low: "You are skeptical of others' motives and tend to see people as potentially dangerous or untrustworthy. You may have been hurt by betrayal in the past, or you may simply have a more cynical view of human nature. You're cautious about who you trust and may need significant evidence of someone's reliability before you're willing to open up to them."
    },
    "Morality": {
      high: "You have exceptionally high moral standards and are consistently honest and straightforward in all your relationships. You avoid manipulation, deception, or any form of dishonesty, even when it might be to your advantage. You believe that integrity and truthfulness are fundamental to your character, and you may find it difficult to understand why others would choose to be dishonest.",
      medium: "You generally value honesty and try to be straightforward in your relationships, but you also recognize that sometimes some level of deception or tactful communication may be necessary to avoid hurting others or to navigate complex social situations. You believe in being honest but also in being kind, and you may sometimes choose to be diplomatic rather than brutally honest.",
      low: "You believe that some level of deception is necessary in social relationships and that complete honesty isn't always the best policy. You may see manipulation as a normal part of human interaction and believe that people need to be strategic about what they reveal to others. You may find that being too honest can sometimes cause problems or hurt feelings, and you prefer to maintain some privacy or mystery in your relationships."
    },
    "Altruism": {
      high: "You have an exceptionally generous and altruistic nature, genuinely enjoying helping others and finding it personally rewarding and fulfilling. You often go out of your way to assist others, even when it's not convenient for you, and you may volunteer your time, resources, or expertise to help those in need. You find great satisfaction in making a positive difference in others' lives and may be known for your selfless acts of kindness.",
      medium: "You are willing to help others when asked and can be generous with your time and resources, but you don't always seek out opportunities to assist others. You value helping people you care about and may contribute to charitable causes, but you also recognize the importance of taking care of your own needs and boundaries.",
      low: "You tend to see requests for help as impositions rather than opportunities, and you may find it difficult to prioritize others' needs over your own. You may believe that people should be responsible for solving their own problems and that excessive helping can actually enable dependency. You value your own time and resources and may find that helping others drains your energy or interferes with your own goals and priorities."
    },
    "Cooperation": {
      high: "You have an exceptionally cooperative nature and actively avoid confrontations, often compromising your own needs and preferences to maintain harmony in relationships and group settings. You value peace and cooperation over being right or getting your way, and you may go to great lengths to avoid conflict or disagreement. You believe that compromise and collaboration lead to better outcomes for everyone, and you may be known for your ability to bring people together and find common ground.",
      medium: "You are generally cooperative and try to work with others when possible, but you also recognize the importance of standing your ground when something is truly important to you. You value harmony and collaboration, but you also understand that sometimes you need to assert yourself or disagree with others to protect your interests or values. You can be flexible and accommodating, but you also have boundaries and limits to how much you're willing to compromise.",
      low: "You are more likely to intimidate others or use aggressive tactics to get your way, and you may not be particularly concerned about maintaining harmony or avoiding conflict. You may see cooperation as a sign of weakness and prefer to use your power or influence to achieve your goals. You may find that being confrontational or competitive is more effective than trying to work collaboratively with others."
    },
    "Modesty": {
      high: "You have an exceptionally modest nature and consistently downplay your achievements, avoiding drawing attention to yourself or your accomplishments. You may feel uncomfortable when others praise you or recognize your successes, and you prefer to let your work speak for itself rather than promoting yourself. You believe that humility is a virtue and that boasting or self-promotion is inappropriate.",
      medium: "You are modest about some accomplishments but can acknowledge others when appropriate, finding a balance between humility and self-confidence. You don't feel the need to constantly promote yourself or your achievements, but you also recognize the importance of being able to discuss your successes when relevant. You value humility but also understand that sometimes you need to advocate for yourself or your work to be recognized and appreciated.",
      low: "You may be seen as arrogant or boastful, and you're willing to claim superiority or highlight your achievements to others. You may feel comfortable promoting yourself and your accomplishments, and you may not be particularly concerned about appearing modest or humble. You believe that it's important to advocate for yourself and your work, and you may find that being confident and assertive about your abilities is necessary for success and recognition."
    },
    "Sympathy": {
      high: "You have an exceptionally sympathetic nature and are deeply moved by others' suffering, often feeling compelled to help or take action to alleviate their pain. You may find yourself emotionally affected by others' struggles, even when they don't directly involve you, and you may go out of your way to provide comfort, support, or assistance. You have a strong capacity for empathy and may find it difficult to remain detached from others' problems.",
      medium: "You feel some sympathy for others' suffering but can balance it with objective judgment and practical considerations. You can be moved by others' struggles and may offer help when appropriate, but you also recognize the importance of maintaining healthy boundaries and not taking on others' problems as your own. You value compassion but also understand the need to be realistic about what you can and cannot do to help others.",
      low: "You tend to make objective judgments based on reason rather than emotion, and you may not be particularly moved by others' suffering or struggles. You may find it difficult to understand why others would be so affected by problems that don't directly involve them, and you may prefer to focus on practical solutions rather than emotional support. You value logic and rationality over emotional responses."
    }
  },
  N: {
    "Anxiety": {
      high: "You experience high levels of anxiety and often feel tense and worried, frequently anticipating potential problems or negative outcomes. You may find yourself constantly on edge, worrying about things that might go wrong, and you may have difficulty relaxing or feeling at ease. You may experience physical symptoms of anxiety such as muscle tension, restlessness, or difficulty sleeping, and you may find that your worries interfere with your daily life and relationships.",
      medium: "You experience some anxiety but can usually manage it effectively, finding ways to cope with worry and stress without it overwhelming you. You may have occasional anxious thoughts or feelings, but you're generally able to keep them in perspective and not let them control your life. You may use various strategies to manage your anxiety, such as exercise, meditation, or talking to others.",
      low: "You remain calm and fearless even in potentially stressful situations, rarely experiencing anxiety or worry. You have a natural ability to stay composed under pressure and don't tend to anticipate problems or negative outcomes. You may find that others look to you for stability and reassurance during difficult times, and you're able to maintain your cool even when things don't go as planned."
    },
    "Anger": {
      high: "You have a tendency to get irritated easily and may feel enraged when things don't go your way, often experiencing intense anger that can be difficult to control. You may find yourself frequently frustrated by minor inconveniences or setbacks, and you may have a short fuse when dealing with difficult people or situations. You may experience physical symptoms of anger such as increased heart rate, muscle tension, or difficulty thinking clearly, and you may find that your anger interferes with your relationships and daily life.",
      medium: "You sometimes get angry but generally control your temper, finding ways to manage your frustration and anger without letting it overwhelm you. You may experience occasional angry feelings, but you're usually able to keep them in check and not let them control your behavior. You may use various strategies to manage your anger, such as taking deep breaths, walking away from the situation, or talking to someone you trust.",
      low: "You stay calm when provoked and rarely get angry, maintaining your composure even in frustrating or difficult situations. You have a natural ability to remain patient and level-headed, and you don't tend to let minor inconveniences or setbacks affect your mood or behavior. You may find that others look to you for stability and calm during stressful times, and you're able to help others stay composed even when they're feeling angry or frustrated."
    },
    "Depression": {
      high: "You frequently experience feelings of depression and may feel downhearted, hopeless, or overwhelmed by life's challenges. You may lose interest in activities that once brought you joy, and you may find it difficult to find motivation or energy to engage with the world around you. You may experience physical symptoms such as fatigue, changes in appetite or sleep, and difficulty concentrating, and you may find that these feelings interfere with your daily life and relationships.",
      medium: "You experience some sadness and occasional low moods, but you generally maintain your energy and interest in life. You may have periods when you feel down or discouraged, but you're usually able to bounce back and find ways to cope with difficult emotions. You may use various strategies to manage your mood, such as exercise, spending time with loved ones, or engaging in activities you enjoy.",
      low: "You are free from depressive feelings and maintain positive energy and interest in life, rarely experiencing prolonged periods of sadness or hopelessness. You have a natural resilience and optimism that helps you navigate life's challenges without becoming overwhelmed or discouraged. You may find that you're able to maintain a positive outlook even during difficult times, and you may be a source of support and encouragement for others who are struggling with their own emotional challenges."
    },
    "Self-Consciousness": {
      high: "You have a high level of self-consciousness and frequently worry about others' judgments and opinions, often feeling shy or uncomfortable in social situations. You may find yourself constantly concerned about how you're being perceived by others, and you may avoid social situations or activities where you might be the center of attention. You may experience physical symptoms such as blushing, sweating, or difficulty speaking when you feel self-conscious, and you may find that these feelings interfere with your ability to form relationships or pursue your goals.",
      medium: "You are somewhat concerned about others' opinions but not overwhelmed by them, finding a balance between caring about how you're perceived and not letting it control your life. You may feel self-conscious in certain situations, but you're usually able to manage these feelings and not let them prevent you from participating in social activities or pursuing your goals. You may use various strategies to manage your self-consciousness, such as focusing on others, practicing self-compassion, or gradually exposing yourself to situations that make you feel uncomfortable.",
      low: "You don't feel nervous in social situations and are comfortable with attention, rarely worrying about others' judgments or opinions. You have a natural confidence and self-assurance that allows you to be yourself in social settings, and you don't tend to second-guess yourself or worry about how you're being perceived. You may find that you're able to speak up in groups, take on leadership roles, or pursue your goals without being held back by self-doubt or fear of judgment."
    },
    "Immoderation": {
      high: "You struggle with self-control and often act on strong cravings or impulses, finding it difficult to resist temptations even when you know they're not in your best interest. You may find yourself giving in to immediate gratification frequently, whether it's related to food, shopping, social media, or other activities. You may experience intense urges that feel overwhelming and difficult to control, and you may find that these impulses interfere with your ability to achieve long-term goals or maintain healthy habits.",
      medium: "You sometimes have trouble resisting temptations but usually manage to maintain some level of self-control, finding a balance between giving in to immediate desires and working toward long-term goals. You may experience occasional strong cravings or impulses, but you're usually able to resist them or find healthier alternatives. You may use various strategies to manage your impulses, such as setting boundaries, avoiding triggers, or finding alternative activities.",
      low: "You don't experience strong irresistible urges and maintain good self-control, rarely struggling with impulses or cravings that are difficult to resist. You have a natural ability to delay gratification and work toward long-term goals, and you don't tend to give in to immediate desires that might interfere with your well-being or success. You may find that you're able to maintain healthy habits and make decisions that align with your values without being swayed by temporary impulses or cravings."
    },
    "Vulnerability": {
      high: "You feel overwhelmed and helpless when under pressure or stress, often struggling to cope with difficult situations and may find yourself becoming paralyzed or unable to think clearly when facing challenges. You may experience intense feelings of anxiety, panic, or despair when things don't go as planned, and you may find it difficult to make decisions or take action when you're under pressure.",
      medium: "You sometimes struggle with stress but generally cope well, finding ways to manage difficult situations without becoming overwhelmed. You may experience occasional feelings of stress or pressure, but you're usually able to work through them and find solutions to problems. You may use various strategies to manage stress, such as taking breaks, talking to others, or practicing relaxation techniques.",
      low: "You stay poised and clear-thinking even under significant pressure, maintaining your composure and ability to make good decisions even in the most challenging situations. You have a natural resilience and emotional stability that helps you navigate life's difficulties without becoming overwhelmed or paralyzed by stress. You may find that you're able to help others stay calm during difficult times, and you're often seen as a source of strength and stability by those around you."
    }
  }
};

export const P1_PROMPTS: Record<DomainKey, {q1:string;q2:string;q3:string}> = {
  O: {
    q1: "You join a new project today. Which three Openness moves do you do first? Pick 3.",
    q2: "From your Q1 picks, which two do you drop? Pick 2.",
    q3: "Resolver. From these few that are still unclear for you, pick two that feel more you when you’re not under deadline. Pick 2."
  },
  C: {
    q1: "It’s a demanding day. Which three Conscientiousness moves do you do first? Pick 3.",
    q2: "From your Q1 picks, which two do you drop? Pick 2.",
    q3: "Resolver. From these few that are still unclear for you, pick two that feel more you when you’re not under deadline. Pick 2."
  },
  E: {
    q1: "You enter a live group setting. Which three Extraversion moves show first? Pick 3.",
    q2: "From your Q1 picks, which two do you drop? Pick 2.",
    q3: "Resolver. From these few that are still unclear for you, pick two that feel more you when you’re not under deadline. Pick 2."
  },
  A: {
    q1: "You join a team with friction. Which three Agreeableness moves do you do first? Pick 3.",
    q2: "From your Q1 picks, which two do you drop? Pick 2.",
    q3: "Resolver. From these few that are still unclear for you, pick two that feel more you when you’re not under deadline. Pick 2."
  },
  N: {
    q1: "Under pressure today, which three Neuroticism reactions show up first? Pick 3.",
    q2: "From your Q1 picks, which two do you drop? Pick 2.",
    q3: "Resolver. From these few that are still unclear for you, pick two that feel more you when you’re not under deadline. Pick 2."
  }
};

export const FACET_HINTS: Record<DomainKey, Record<string,string>> = {
  O: {
    "Imagination":"Sketch a vivid “how this could go” in your head.",
    "Artistic Interests":"Tune look, sound, and feel for resonance.",
    "Emotionality":"Read the emotional tone and connect people.",
    "Adventurousness":"Propose a new path or method to try.",
    "Intellect":"Break the system into parts and model it.",
    "Liberalism":"Challenge default rules and suggest better norms."
  },
  C: {
    "Self-Efficacy":"Assume capability and take ownership of the task.",
    "Orderliness":"Lay out structure, folders, and checklists.",
    "Dutifulness":"Clarify obligations and align to rules.",
    "Achievement-Striving":"Set a stretch target and milestones.",
    "Self-Discipline":"Block distractions and start now.",
    "Cautiousness":"Map risks and decide with care."
  },
  E: {
    "Friendliness":"Open warmly and put others at ease.",
    "Gregariousness":"Move into the group and mingle.",
    "Assertiveness":"Take the mic and steer the agenda.",
    "Activity Level":"Keep a brisk pace and stack tasks.",
    "Excitement-Seeking":"Inject energy and chase stimulation.",
    "Cheerfulness":"Lift the mood and keep it upbeat."
  },
  A: {
    "Trust":"Extend good faith to people.",
    "Morality":"Stay straightforward and fair.",
    "Altruism":"Offer help without being asked.",
    "Cooperation":"Find common ground and adapt.",
    "Modesty":"Downplay your wins.",
    "Sympathy":"Tune into others’ pain and respond."
  },
  N: {
    "Anxiety":"Scan for what could go wrong.",
    "Anger":"Feel heat at blockers and unfairness.",
    "Depression":"Lose drive and dim interest.",
    "Self-Consciousness":"Worry about how you’re seen.",
    "Immoderation":"Reach for quick relief or excess.",
    "Vulnerability":"Feel overwhelmed and seek cover."
  }
};

export const ANCHORS: Record<DomainKey, Record<string, [string,string]>> = {
  O: {
    "Imagination": [
      "I vividly imagine new possibilities during everyday tasks.",
      "I often picture detailed scenes in my mind."
    ],
    "Artistic Interests": [
      "I seek out art, music, or design in everyday life.",
      "Aesthetic details matter to me when I make choices."
    ],
    "Emotionality": [
      "I pay close attention to my own feelings.",
      "My emotions are an important guide for decisions."
    ],
    "Adventurousness": [
      "I enjoy trying unfamiliar activities.",
      "I like exploring new places without much planning."
    ],
    "Intellect": [
      "I enjoy solving complex problems.",
      "I like discussing abstract ideas."
    ],
    "Liberalism": [
      "I question authority and traditional rules.",
      "I support changes to established practices."
    ]
  },
  C: {
    "Self-Efficacy": [
      "I believe I can handle difficult tasks.",
      "When problems arise, I feel capable."
    ],
    "Orderliness": [
      "I keep my spaces neat and organized.",
      "I like clear structure in my work."
    ],
    "Dutifulness": [
      "I feel obligated to follow through on commitments.",
      "I do what I say I will do."
    ],
    "Achievement-Striving": [
      "I set ambitious goals for myself.",
      "I push to be among the best at what I do."
    ],
    "Self-Discipline": [
      "I start tasks promptly and keep going until done.",
      "I resist distractions when I am working."
    ],
    "Cautiousness": [
      "I think through risks before acting.",
      "I prefer safe choices over gambles."
    ]
  },
  E: {
    "Friendliness": [
      "I warm up to people quickly.",
      "I make others feel welcome."
    ],
    "Gregariousness": [
      "I enjoy being in groups.",
      "I seek company rather than solitude."
    ],
    "Assertiveness": [
      "I take the lead in group discussions.",
      "I speak up to influence decisions."
    ],
    "Activity Level": [
      "I move at a fast daily pace.",
      "I keep myself busy most of the time."
    ],
    "Excitement-Seeking": [
      "I chase thrilling experiences.",
      "I enjoy taking bold risks for fun."
    ],
    "Cheerfulness": [
      "I display a positive mood to others.",
      "I often feel upbeat."
    ]
  },
  A: {
    "Trust": [
      "I assume most people have good intentions.",
      "I give others the benefit of the doubt."
    ],
    "Morality": [
      "I avoid manipulating people even when it would help me.",
      "I stick to my principles in small choices."
    ],
    "Altruism": [
      "I go out of my way to help strangers.",
      "I enjoy doing favors without expecting returns."
    ],
    "Cooperation": [
      "I compromise to keep harmony.",
      "I accept group decisions even when I disagree."
    ],
    "Modesty": [
      "I downplay my achievements.",
      "I avoid drawing attention to myself."
    ],
    "Sympathy": [
      "I feel moved by others' suffering.",
      "I am affected by other people's pain."
    ]
  },
  N: {
    "Anxiety": [
      "I often feel tense or worried.",
      "I feel anxious in ordinary situations."
    ],
    "Anger": [
      "I get irritated easily.",
      "I find it hard to stay calm when provoked."
    ],
    "Depression": [
      "I frequently feel downhearted.",
      "I lose interest in things I used to enjoy."
    ],
    "Self-Consciousness": [
      "I worry about how others see me.",
      "I feel embarrassed easily."
    ],
    "Immoderation": [
      "I find it hard to resist temptations.",
      "I act on cravings quickly."
    ],
    "Vulnerability": [
      "I struggle to cope under stress.",
      "I feel overwhelmed when things go wrong."
    ]
  }
};

export const CONFIRM: Record<DomainKey, Record<string,string>> = {
  O: {
    "Imagination": "In the last 2 weeks, I deliberately imagined alternative ways to do a routine task.",
    "Artistic Interests": "In the last month, I sought out art, music, or design for its own sake.",
    "Emotionality": "In the last month, I made a decision based on how I felt rather than only facts.",
    "Adventurousness": "In the last month, I tried an unfamiliar activity or place.",
    "Intellect": "In the last month, I engaged with complex ideas for enjoyment.",
    "Liberalism": "In the last month, I questioned a traditional rule or practice."
  },
  C: {
    "Self-Efficacy": "In the last month, I took on a difficult task confident I would figure it out.",
    "Orderliness": "In the last week, I organized a cluttered area to my standard.",
    "Dutifulness": "In the last month, I followed through on a commitment even when inconvenient.",
    "Achievement-Striving": "In the last month, I set a concrete stretch goal for myself.",
    "Self-Discipline": "In the last week, I worked through distractions until a task was finished.",
    "Cautiousness": "In the last month, I paused action to consider risks."
  },
  E: {
    "Friendliness": "In the last week, I initiated a warm interaction with someone new.",
    "Gregariousness": "In the last month, I chose a group activity over being alone.",
    "Assertiveness": "In the last month, I took the lead in a discussion or decision.",
    "Activity Level": "In the last week, I maintained a fast pace through most days.",
    "Excitement-Seeking": "In the last month, I sought a thrilling or stimulating experience.",
    "Cheerfulness": "In the last week, I displayed an upbeat mood to others."
  },
  A: {
    "Trust": "In the last month, I assumed good intent in a doubtful situation.",
    "Morality": "In the last month, I refused a tempting shortcut because it felt wrong.",
    "Altruism": "In the last month, I helped someone with no expectation of return.",
    "Cooperation": "In the last month, I compromised to keep harmony.",
    "Modesty": "In the last month, I downplayed my achievements.",
    "Sympathy": "In the last month, I felt moved by someone’s hardship and considered helping."
  },
  N: {
    "Anxiety": "In the last week, I felt tense or worried on several days.",
    "Anger": "In the last week, I found myself irritated more than I wanted.",
    "Depression": "In the last week, I felt downhearted on multiple days.",
    "Self-Consciousness": "In the last week, I worried about others’ judgments of me.",
    "Immoderation": "In the last week, I had trouble resisting a strong craving.",
    "Vulnerability": "In the last week, I felt overwhelmed when things went wrong."
  }
};

export function canonicalFacets(domain: DomainKey): string[] {
  return DOMAINS[domain].facets.slice();
}


