import { env } from '../config/env.js';
import { QuizQuestion, ContentSection } from '../models/index.js';
import { logger } from '../utils/logger.js';

export interface GeminiModule {
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes: number;
  content_sections: ContentSection[];
  key_takeaways: string[];
  quiz: QuizQuestion[];
}

const MODULES_PROMPT = `You are an expert caregiving educator. Generate exactly 5 professional caregiving training modules for rural Indian caregivers (in English).

Return ONLY valid JSON — no markdown, no code fences, no explanation. The JSON must be an array of 5 objects with this exact shape:
[
  {
    "title": "string (concise, ≤60 chars)",
    "description": "string (1–2 sentences)",
    "category": "one of: Fundamentals | Safety | Medical | Nutrition | Mental Health",
    "difficulty": "one of: beginner | intermediate | advanced",
    "duration_minutes": number (15–45),
    "content_sections": [
      { "heading": "string", "body": "string (2–3 sentences)" }
    ],
    "key_takeaways": ["string", "string", "string", "string"],
    "quiz": [
      {
        "question": "string",
        "options": ["A", "B", "C", "D"],
        "correctIndex": 0,
        "explanation": "string (1 sentence explaining why correct)"
      }
    ]
  }
]

Requirements:
- content_sections: exactly 4 sections per module
- key_takeaways: exactly 4 bullet points per module
- quiz: exactly 5 questions per module, correctIndex is 0-based (0–3)
- Topics must cover: 1) Basic patient care & hygiene, 2) Emergency first aid & SOS, 3) Nutrition for elderly & sick, 4) Mental health & emotional support, 5) Safe medication management`;

export async function generateCaregivingModules(): Promise<GeminiModule[]> {
  if (!env.GEMINI_API_KEY) {
    logger.warn('GEMINI_API_KEY not set — returning fallback modules');
    return getFallbackModules();
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;

  const body = {
    contents: [{ parts: [{ text: MODULES_PROMPT }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    logger.error('Gemini API error', { status: response.status, body: errText });
    return getFallbackModules();
  }

  const data = await response.json() as any;
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  try {
    // Strip any accidental markdown code fences
    const cleaned = text.replace(/^```[^\n]*\n?/, '').replace(/```$/, '').trim();
    const modules: GeminiModule[] = JSON.parse(cleaned);
    if (!Array.isArray(modules) || modules.length === 0) throw new Error('Empty array');
    logger.info(`Gemini generated ${modules.length} modules`);
    return modules;
  } catch (err) {
    logger.error('Failed to parse Gemini response', { err, text: text.slice(0, 500) });
    return getFallbackModules();
  }
}

function getFallbackModules(): GeminiModule[] {
  return [
    {
      title: 'Basic Patient Care & Hygiene',
      description: 'Learn essential daily care routines that keep patients comfortable, clean, and dignified.',
      category: 'Fundamentals',
      difficulty: 'beginner',
      duration_minutes: 20,
      content_sections: [
        { heading: 'Personal Hygiene Basics', body: 'Regular bathing, oral care, and skin hygiene prevent infections and promote comfort. Assist patients gently and respect their privacy at all times.' },
        { heading: 'Bed & Linen Management', body: 'Change bed linen every 2–3 days or when soiled. Keep the patient\'s environment clean, dry, and odour-free to prevent pressure sores.' },
        { heading: 'Mobility & Positioning', body: 'Reposition bedridden patients every 2 hours to prevent pressure ulcers. Use proper lifting techniques to protect both the caregiver and patient.' },
        { heading: 'Infection Prevention', body: 'Wash hands thoroughly before and after all care activities. Use gloves when handling bodily fluids and dispose of waste properly.' },
      ],
      key_takeaways: [
        'Wash hands before and after every care task',
        'Reposition bedridden patients every 2 hours',
        'Always respect patient dignity and privacy',
        'Change linens promptly when soiled to prevent infections',
      ],
      quiz: [
        { question: 'How often should bedridden patients be repositioned to prevent pressure sores?', options: ['Every 2 hours', 'Every 6 hours', 'Once daily', 'Only when uncomfortable'], correctIndex: 0, explanation: 'Repositioning every 2 hours relieves pressure points and prevents pressure ulcers from forming.' },
        { question: 'When should a caregiver wash their hands?', options: ['Before and after all care activities', 'Only after cleaning', 'Once at the start of shift', 'When hands look dirty'], correctIndex: 0, explanation: 'Hand hygiene before and after every task is the single most effective way to prevent spreading infection.' },
        { question: 'What is the correct approach to patient privacy during bathing?', options: ['Cover areas not being washed, close doors', 'Leave doors open for safety', 'Call family to watch', 'Ask the patient to bathe alone'], correctIndex: 0, explanation: 'Maintaining dignity means covering exposed areas and ensuring privacy at all times.' },
        { question: 'How often should bed linen be changed under normal circumstances?', options: ['Every 2–3 days or when soiled', 'Weekly', 'Monthly', 'Only when wet'], correctIndex: 0, explanation: 'Regular linen changes maintain hygiene and prevent skin infections.' },
        { question: 'Which is the correct technique for lifting a patient?', options: ['Bend knees, keep back straight, use leg muscles', 'Bend at the waist with straight legs', 'Pull quickly to minimise contact time', 'Always lift alone for speed'], correctIndex: 0, explanation: 'Proper body mechanics (knees bent, straight back) protect both caregiver and patient from injury.' },
      ],
    },
    {
      title: 'Emergency First Aid & SOS Response',
      description: 'Recognise warning signs, respond to emergencies, and use the SevaSetu SOS feature effectively.',
      category: 'Safety',
      difficulty: 'beginner',
      duration_minutes: 25,
      content_sections: [
        { heading: 'Recognising Emergencies', body: 'Key warning signs include sudden chest pain, difficulty breathing, loss of consciousness, severe bleeding, and sudden paralysis. Act immediately — every minute matters.' },
        { heading: 'Basic CPR & Recovery Position', body: 'If a patient is unresponsive and not breathing normally, begin CPR: 30 chest compressions followed by 2 rescue breaths. Place conscious but unresponsive patients in the recovery position.' },
        { heading: 'Handling Falls & Injuries', body: 'Do not move a fallen patient if a spinal injury is suspected. Call for help, keep the patient calm, apply pressure to bleeding wounds, and await medical assistance.' },
        { heading: 'Using SevaSetu SOS', body: 'Tap the SOS button in the app to instantly alert family contacts and the platform support team with your GPS location. Stay on the line and keep the patient calm.' },
      ],
      key_takeaways: [
        'Learn the warning signs: chest pain, trouble breathing, sudden weakness',
        'Start CPR immediately for an unresponsive patient not breathing normally',
        'Never move a patient with suspected spinal injury',
        'Use the SevaSetu SOS button to alert help instantly with your location',
      ],
      quiz: [
        { question: 'What is the correct CPR compression-to-breath ratio for adults?', options: ['30 compressions : 2 breaths', '15 compressions : 2 breaths', '5 compressions : 1 breath', '10 compressions : 1 breath'], correctIndex: 0, explanation: 'The universal adult CPR ratio is 30 chest compressions followed by 2 rescue breaths.' },
        { question: 'A patient falls and complains of neck pain. What should you do first?', options: ['Keep them still and call for medical help', 'Help them sit up immediately', 'Give them water', 'Massage the neck to relieve pain'], correctIndex: 0, explanation: 'Suspected spinal injuries require the patient to remain still; movement can cause permanent paralysis.' },
        { question: 'Which symptom is a key warning sign of a stroke?', options: ['Sudden facial drooping or arm weakness', 'Mild headache', 'Slight dizziness when standing', 'Low appetite'], correctIndex: 0, explanation: 'Facial drooping, arm weakness, and speech difficulty (FAST) are the classic stroke warning signs.' },
        { question: 'What does the SevaSetu SOS button do?', options: ['Alerts family and support team with your GPS location', 'Calls the nearest hospital automatically', 'Sends a text message to the caregiver', 'Locks the phone for safety'], correctIndex: 0, explanation: 'The SOS button instantly shares your real-time location with all registered emergency contacts.' },
        { question: 'How should you stop severe bleeding from a wound?', options: ['Apply firm, direct pressure with a clean cloth', 'Pour water to clean first, then leave open', 'Tie a tight tourniquet immediately', 'Leave it to clot naturally'], correctIndex: 0, explanation: 'Firm direct pressure is the first-line treatment; it helps blood clot and reduces blood loss.' },
      ],
    },
    {
      title: 'Nutrition for Elderly & Sick Patients',
      description: 'Understand dietary needs, prepare suitable meals, and manage common eating difficulties in your patients.',
      category: 'Nutrition',
      difficulty: 'intermediate',
      duration_minutes: 30,
      content_sections: [
        { heading: 'Nutritional Needs of Elderly Patients', body: 'Older adults need adequate protein, calcium, and vitamins D and B12. Appetite often decreases with age, so focus on nutrient-dense foods in smaller, more frequent meals.' },
        { heading: 'Hydration & Fluid Management', body: 'Dehydration is a leading cause of hospitalisation in the elderly. Encourage 6–8 glasses of water daily; monitor urine colour as a simple hydration indicator.' },
        { heading: 'Preparing Safe Meals', body: 'Texture-modify foods for patients with swallowing difficulties — soft, minced, or pureed options prevent choking. Always check for allergies and dietary restrictions.' },
        { heading: 'Managing Diabetes & Heart Conditions', body: 'For diabetic patients, limit refined sugars and white rice; prioritise whole grains, vegetables, and lean protein. Heart patients should reduce salt and fried foods.' },
      ],
      key_takeaways: [
        'Serve smaller, more frequent meals to improve intake in low-appetite patients',
        'Check urine colour daily — pale yellow means well hydrated',
        'Modify food textures for patients with swallowing difficulties',
        'Follow prescribed dietary restrictions for diabetes and heart conditions',
      ],
      quiz: [
        { question: 'How many glasses of water should an elderly patient drink daily?', options: ['6–8 glasses', '1–2 glasses', '10–12 glasses', 'Only when thirsty'], correctIndex: 0, explanation: 'The elderly often have a reduced thirst sensation, so 6–8 glasses ensures adequate hydration.' },
        { question: 'What food texture is safest for patients with swallowing difficulties?', options: ['Pureed or soft foods', 'Hard crackers and nuts', 'Whole raw vegetables', 'Chewy meats'], correctIndex: 0, explanation: 'Pureed or soft foods reduce the risk of choking and aspiration in patients with dysphagia.' },
        { question: 'Which nutrient is especially important for maintaining bone health in elderly patients?', options: ['Calcium and Vitamin D', 'Iron and Vitamin C', 'Sugar and carbohydrates', 'Sodium and potassium'], correctIndex: 0, explanation: 'Calcium and Vitamin D work together to maintain bone density and prevent fractures in older adults.' },
        { question: 'For a diabetic patient, which food should be limited?', options: ['White rice and refined sugar', 'Green vegetables', 'Lentils and legumes', 'Plain water'], correctIndex: 0, explanation: 'Refined carbohydrates spike blood sugar rapidly; whole grains and vegetables are far better choices.' },
        { question: 'What is a simple indicator of good hydration?', options: ['Pale yellow urine', 'Dark brown urine', 'No urine for 8 hours', 'Feeling thirsty'], correctIndex: 0, explanation: 'Pale yellow urine indicates adequate hydration; darker colours signal dehydration.' },
      ],
    },
    {
      title: 'Mental Health & Emotional Support',
      description: 'Provide compassionate emotional care, recognise depression and anxiety, and support both patient and family.',
      category: 'Mental Health',
      difficulty: 'intermediate',
      duration_minutes: 25,
      content_sections: [
        { heading: 'Understanding Caregiver-Patient Relationships', body: 'Trust is built through consistency, empathy, and respecting autonomy. Patients who feel heard and respected recover faster and are more cooperative with care.' },
        { heading: 'Recognising Depression & Anxiety', body: 'Watch for persistent sadness, loss of interest, sleep changes, and withdrawal. These are not a normal part of ageing — report concerns to the family or a health professional.' },
        { heading: 'Communication Techniques', body: 'Use simple language, maintain eye contact, and avoid rushing. For patients with dementia, use a calm tone, short sentences, and gentle redirection rather than argument.' },
        { heading: 'Supporting Family Members', body: 'Family caregivers experience significant stress. Offer reassurance, keep them regularly informed, and recognise signs of caregiver burnout in yourself and others.' },
      ],
      key_takeaways: [
        'Active listening and empathy build patient trust and improve outcomes',
        'Depression is not a normal part of ageing — always report concerns',
        'Use calm, short sentences and gentle redirection with dementia patients',
        'Recognise caregiver burnout in yourself and seek support when needed',
      ],
      quiz: [
        { question: 'Which of these is a warning sign of depression in an elderly patient?', options: ['Persistent sadness and withdrawal from activities', 'Sleeping 7–8 hours per night', 'Enjoying meals and conversation', 'Regular bowel movements'], correctIndex: 0, explanation: 'Persistent low mood and withdrawal from previously enjoyed activities are classic signs of depression.' },
        { question: 'How should you communicate with a patient who has dementia?', options: ['Calm tone, short sentences, gentle redirection', 'Loud voice to ensure they hear you', 'Argue to correct their confusion', 'Ignore confused statements'], correctIndex: 0, explanation: 'Calm, simple communication and gentle redirection reduce agitation in dementia patients.' },
        { question: 'What is the most important foundation of a good caregiver-patient relationship?', options: ['Consistency, empathy, and respecting autonomy', 'Speed and efficiency of tasks', 'Avoiding emotional conversations', 'Strict scheduling with no flexibility'], correctIndex: 0, explanation: 'Patients who feel respected and heard are more cooperative and have better health outcomes.' },
        { question: 'What is caregiver burnout?', options: ['Physical and emotional exhaustion from caregiving duties', 'Being too cheerful at work', 'Completing too many tasks quickly', 'Getting too attached to patients'], correctIndex: 0, explanation: 'Burnout is chronic stress that leads to exhaustion, detachment, and reduced ability to care effectively.' },
        { question: 'Who should you inform if you suspect a patient is experiencing depression?', options: ['Family members and a health professional', 'Keep it private to protect patient dignity', 'Only document it, take no action', 'Only tell the patient directly'], correctIndex: 0, explanation: 'Depression is treatable — informing family and healthcare providers ensures the patient gets proper help.' },
      ],
    },
    {
      title: 'Safe Medication Management',
      description: 'Administer medications safely, recognise side effects, and avoid dangerous errors in daily medication routines.',
      category: 'Medical',
      difficulty: 'advanced',
      duration_minutes: 35,
      content_sections: [
        { heading: 'The Five Rights of Medication Safety', body: 'Always verify: Right Patient, Right Medication, Right Dose, Right Route, Right Time. Skipping any of these checks is a leading cause of medication errors.' },
        { heading: 'Storing Medications Correctly', body: 'Store medications in original packaging in a cool, dry place away from sunlight. Check expiry dates monthly; never use expired medications and return them to a pharmacy.' },
        { heading: 'Recognising Side Effects', body: 'Common side effects include nausea, dizziness, and skin rashes. Serious signs such as difficulty breathing, swelling, or sudden confusion require immediate medical attention.' },
        { heading: 'Managing Multiple Medications', body: 'Many elderly patients take 5+ medications, increasing interaction risks. Use a pill organiser and a written schedule. Never crush tablets or open capsules without checking with a pharmacist.' },
      ],
      key_takeaways: [
        'Always verify the 5 Rights before giving any medication',
        'Check expiry dates monthly and dispose of expired medications safely',
        'Report any unusual symptoms after medication immediately',
        'Never crush tablets or open capsules without pharmacist confirmation',
      ],
      quiz: [
        { question: 'What are the Five Rights of medication safety?', options: ['Patient, Medication, Dose, Route, Time', 'Patient, Name, Date, Colour, Smell', 'Doctor, Nurse, Pharmacy, Family, Patient', 'Breakfast, Lunch, Dinner, Bedtime, Emergency'], correctIndex: 0, explanation: 'The Five Rights are a universal safety checklist that prevents the most common medication errors.' },
        { question: 'Where should medications be stored?', options: ['Cool, dry place in original packaging away from sunlight', 'In the refrigerator always', 'On the kitchen counter for easy access', 'In a child\'s room for supervision'], correctIndex: 0, explanation: 'Heat, light, and moisture degrade medications; original packaging preserves correct dosage information.' },
        { question: 'A patient develops sudden difficulty breathing after taking a new medication. What should you do?', options: ['Seek immediate medical help — this is an emergency', 'Wait 30 minutes to see if it improves', 'Give a second dose to compensate', 'Offer water and rest'], correctIndex: 0, explanation: 'Sudden breathing difficulty after medication may indicate a severe allergic reaction (anaphylaxis), which is life-threatening.' },
        { question: 'Can you crush a tablet to make it easier to swallow?', options: ['Only after checking with a pharmacist — some tablets must not be crushed', 'Yes, always — it makes no difference', 'Never, under any circumstances', 'Only for elderly patients'], correctIndex: 0, explanation: 'Extended-release and enteric-coated tablets must never be crushed; doing so can cause dangerous overdose.' },
        { question: 'How often should you check medication expiry dates?', options: ['Monthly', 'Annually', 'Only when the patient feels unwell', 'Expiry dates do not matter'], correctIndex: 0, explanation: 'Monthly checks ensure you catch expiring medications in time and replace them before they become ineffective or harmful.' },
      ],
    },
  ];
}
