export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ModuleContent {
  sections: { heading: string; body: string }[];
  keyTakeaways: string[];
  quiz: QuizQuestion[];
}

export const MODULE_CONTENT: Record<string, ModuleContent> = {
  m1: {
    sections: [
      { heading: 'Why Hygiene Matters', body: 'Elderly patients are more susceptible to infections due to weakened immune systems. Proper hygiene reduces the risk of skin infections, UTIs, and respiratory infections by up to 60%. As a caregiver, your hygiene practices directly impact your patient\'s health outcomes.' },
      { heading: 'Bathing Techniques', body: 'Always check water temperature (37-38°C) before bathing. Use a handheld showerhead for seated patients. Start from the cleanest area and work toward the dirtiest. Pay special attention to skin folds, underarms, and groin area. Pat dry completely to prevent fungal infections.' },
      { heading: 'Oral Care', body: 'Brush teeth or dentures twice daily using soft-bristled brushes. For bedridden patients, use oral swabs with diluted mouthwash. Check for mouth sores, bleeding gums, or loose teeth regularly and report to the family.' },
      { heading: 'Grooming & Dignity', body: 'Maintain the patient\'s preferred grooming routine. Trim nails carefully using proper nail clippers. Keep hair clean and styled as the patient prefers. Always explain what you\'re doing before touching the patient.' },
    ],
    keyTakeaways: ['Always check water temperature before bathing', 'Pat dry all skin folds completely', 'Oral care twice daily — brush or oral swabs', 'Maintain patient dignity and preferences at all times'],
    quiz: [
      { question: 'What is the ideal water temperature for bathing an elderly patient?', options: ['30-32°C', '37-38°C', '40-42°C', '35-36°C'], correctIndex: 1, explanation: '37-38°C is warm enough for comfort but won\'t cause burns on sensitive elderly skin.' },
      { question: 'Why should you pat dry skin folds completely after bathing?', options: ['To save time', 'To prevent fungal infections', 'It looks better', 'Hospital policy requires it'], correctIndex: 1, explanation: 'Moisture trapped in skin folds creates a breeding ground for fungi and bacteria.' },
      { question: 'How often should oral care be performed?', options: ['Once a week', 'Once daily', 'Twice daily', 'Only when requested'], correctIndex: 2, explanation: 'Twice daily oral care prevents infections, pneumonia risk, and maintains comfort.' },
    ],
  },
  m2: {
    sections: [
      { heading: 'Recognizing Emergencies', body: 'Learn to identify the signs: chest pain or tightness (possible heart attack), sudden weakness on one side (possible stroke), difficulty breathing, severe bleeding, loss of consciousness, or seizures. Time is critical — every minute matters.' },
      { heading: 'CPR Basics', body: 'If the patient is unresponsive and not breathing: Call 112 immediately. Place heel of hand on center of chest. Push hard and fast (100-120 compressions/minute, 5-6 cm deep). Give 2 rescue breaths after every 30 compressions. Continue until help arrives.' },
      { heading: 'Choking Response', body: 'If the patient can cough, encourage them to keep coughing. If they cannot speak or breathe: Stand behind them, wrap your arms around their waist, make a fist above the navel, and perform firm upward thrusts (Heimlich maneuver). For wheelchair patients, lean them forward and give 5 back blows.' },
      { heading: 'Fall Protocol', body: 'Do NOT immediately try to lift the patient. Check for injuries first — ask about pain, look for visible injuries. If no serious injury, help them roll to their side, get to hands and knees, and use a sturdy chair to stand up. Always document falls and report to the family.' },
    ],
    keyTakeaways: ['Call 112 first in any emergency', 'CPR: 30 compressions, 2 breaths, repeat', 'Never lift a fallen patient without checking for injuries', 'Document and report every incident'],
    quiz: [
      { question: 'What is the correct CPR compression rate?', options: ['60-80 per minute', '80-100 per minute', '100-120 per minute', '120-140 per minute'], correctIndex: 2, explanation: '100-120 compressions per minute ensures adequate blood circulation to the brain.' },
      { question: 'A patient falls. What should you do FIRST?', options: ['Immediately lift them up', 'Call the family', 'Check for injuries before moving', 'Give them water'], correctIndex: 2, explanation: 'Moving a patient with an undetected fracture can cause further injury. Always assess first.' },
      { question: 'The emergency number in India is:', options: ['911', '100', '112', '108'], correctIndex: 2, explanation: '112 is India\'s unified emergency number that connects to police, fire, and ambulance.' },
    ],
  },
  m3: {
    sections: [
      { heading: 'Active Listening', body: 'Give full attention when families share concerns. Maintain eye contact, nod, and paraphrase what they said to confirm understanding. Avoid interrupting or offering solutions immediately — sometimes families just need to be heard.' },
      { heading: 'Daily Updates', body: 'Provide a brief daily update covering: meals eaten, medications given, activities completed, mood observations, and any concerns. Use simple language, avoid medical jargon. A 2-minute update builds enormous trust.' },
      { heading: 'Handling Difficult Conversations', body: 'When delivering bad news or discussing decline, be honest but compassionate. Use "I" statements: "I noticed..." instead of "You should...". Suggest solutions alongside problems. Know when to involve medical professionals.' },
      { heading: 'Cultural Sensitivity', body: 'Respect dietary restrictions (vegetarian, fasting days). Learn basic greetings in the patient\'s language. Understand religious practices and prayer times. Ask the family about preferences rather than assuming.' },
    ],
    keyTakeaways: ['Listen first, advise second', 'Daily 2-minute updates build trust', 'Use "I noticed" instead of "You should"', 'Ask about cultural preferences — never assume'],
    quiz: [
      { question: 'What is the most effective way to build trust with a family?', options: ['Being very formal', 'Providing consistent daily updates', 'Never sharing concerns', 'Only speaking when spoken to'], correctIndex: 1, explanation: 'Consistent, proactive communication shows reliability and care.' },
      { question: 'When delivering bad news, you should:', options: ['Avoid it entirely', 'Use medical jargon to sound professional', 'Be honest but compassionate, suggest solutions', 'Only tell the doctor'], correctIndex: 2, explanation: 'Families deserve honest information delivered with empathy and actionable next steps.' },
    ],
  },
  m4: {
    sections: [
      { heading: 'Repositioning Schedule', body: 'Bedridden patients must be repositioned every 2 hours to prevent pressure sores. Use the clock method: back at 12:00, right side at 2:00, left side at 4:00. Log each position change. Use pillows to support and distribute pressure.' },
      { heading: 'Preventing Pressure Sores', body: 'Inspect skin daily — especially heels, tailbone, elbows, and shoulder blades. Look for redness that doesn\'t fade when pressed. Keep skin clean and dry. Use barrier creams on moisture-prone areas. Report any skin changes immediately.' },
      { heading: 'Bed Bath Technique', body: 'Gather all supplies before starting. Maintain room temperature at 24-26°C. Wash one body section at a time, keeping the rest covered for warmth and dignity. Change water if it becomes cool or soapy. Apply moisturizer after drying.' },
      { heading: 'Transfer Techniques', body: 'For bed-to-wheelchair transfers: Lock wheelchair brakes, position at 30° angle to bed. Help patient sit at bed edge, feet flat on floor. Support under arms, pivot on feet, lower into chair. Never pull on arms or under armpits.' },
    ],
    keyTakeaways: ['Reposition every 2 hours without exception', 'Check pressure points daily for redness', 'Keep one section covered while washing another', 'Lock wheelchair brakes before every transfer'],
    quiz: [
      { question: 'How often should a bedridden patient be repositioned?', options: ['Every 30 minutes', 'Every 2 hours', 'Every 4 hours', 'Every 6 hours'], correctIndex: 1, explanation: 'Every 2 hours prevents pressure sores from developing on vulnerable areas.' },
      { question: 'Which areas are most at risk for pressure sores?', options: ['Hands and feet only', 'Face and neck', 'Heels, tailbone, elbows, shoulder blades', 'Only the back'], correctIndex: 2, explanation: 'Bony prominences with less padding are most vulnerable to pressure damage.' },
    ],
  },
  m5: {
    sections: [
      { heading: 'Dietary Needs of Elderly', body: 'Older adults need fewer calories but more nutrients. Focus on protein (dal, paneer, eggs) for muscle maintenance, calcium (milk, ragi) for bones, and fiber (vegetables, whole grains) for digestion. Hydration is critical — aim for 6-8 glasses of water daily.' },
      { heading: 'Meal Planning for Conditions', body: 'Diabetes: Low glycemic foods, regular small meals, avoid sugar. Hypertension: Reduce salt to <5g/day, increase potassium (bananas, sweet potatoes). Heart disease: Limit saturated fats, use mustard or olive oil. Always follow the doctor\'s dietary plan.' },
      { heading: 'Food Safety', body: 'Wash hands before cooking. Store perishables below 5°C. Reheat food to 74°C minimum. Never serve leftover food older than 24 hours. Check medication interactions with food (e.g., grapefruit with blood pressure medicine).' },
    ],
    keyTakeaways: ['High protein, high fiber, adequate hydration', 'Follow doctor\'s specific dietary restrictions', 'Small frequent meals for diabetic patients', '6-8 glasses of water daily minimum'],
    quiz: [
      { question: 'How much salt should a hypertensive patient consume daily?', options: ['Less than 5g', 'Less than 10g', 'No limit', 'Less than 15g'], correctIndex: 0, explanation: 'WHO recommends less than 5g of salt daily, especially for hypertensive patients.' },
      { question: 'What is the minimum reheating temperature for food safety?', options: ['50°C', '62°C', '74°C', '85°C'], correctIndex: 2, explanation: '74°C kills most harmful bacteria that cause food poisoning.' },
    ],
  },
};

// Default quiz for modules without specific content
export const DEFAULT_CONTENT: ModuleContent = {
  sections: [
    { heading: 'Module Overview', body: 'This module covers essential caregiving skills. Watch the video carefully and take notes on key concepts.' },
    { heading: 'Practical Application', body: 'After completing the video, practice the techniques described with a family member or colleague. Hands-on practice is essential for building confidence.' },
  ],
  keyTakeaways: ['Watch the full video before attempting the quiz', 'Take notes on key procedures', 'Practice techniques in a safe environment', 'Ask questions if anything is unclear'],
  quiz: [
    { question: 'What is the most important quality of a professional caregiver?', options: ['Speed', 'Physical strength', 'Empathy and patience', 'Medical degree'], correctIndex: 2, explanation: 'While all skills matter, empathy and patience form the foundation of quality care.' },
    { question: 'When should you report a concern to the family?', options: ['Never', 'Only if asked', 'Promptly and honestly', 'After a week'], correctIndex: 2, explanation: 'Timely communication prevents small issues from becoming serious problems.' },
  ],
};

export function getModuleContent(moduleId: string): ModuleContent {
  return MODULE_CONTENT[moduleId] || DEFAULT_CONTENT;
}
