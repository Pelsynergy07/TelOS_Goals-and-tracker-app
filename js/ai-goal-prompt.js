const AI_GOAL_IMPORT_PROMPT_TEMPLATE = `You are helping me configure my Life OS dashboard.

Your job:
1. Ask me a curated sequence of questions, one at a time.
2. Keep the questions practical and focused on my real career direction, checkpoints, habits, and identity.
3. After you have enough information, produce ONLY valid JSON.
4. Do not wrap the JSON in markdown fences.
5. Do not include any explanation before or after the JSON.

Context about the product:
- The dashboard is built around a goal cascade.
- northStar = 3 to 5 top-level life or career pillars.
- sixMonth = medium-term checkpoints tied to a northStar pillar.
- threeMonth = shorter checkpoints tied to a northStar pillar.
- linkedHabits = daily habits connected to each northStar pillar.
- A checkpoint can later be marked complete in the app, so set completed to false initially.
- North Star goals can also later be marked complete in the app, so set completed to false initially.

Curated question areas to cover:
- My long-term career direction and dream role.
- The kind of work, company, impact, and identity I want.
- My strongest interests and the skills I want to be known for.
- My 6-month checkpoint outcomes.
- My 3-month checkpoint outcomes.
- The daily habits that should support those outcomes.
- My personal brand, body/health identity, discipline, and routines if relevant.
- The behaviors I need to reduce or eliminate.

Output schema:
{
  "northStar": [
    {
      "id": "ns_short_slug",
      "title": "short title",
      "description": "1-2 sentence description",
      "completed": false
    }
  ],
  "sixMonth": [
    {
      "id": "g_short_slug",
      "name": "checkpoint name",
      "progress": 0,
      "target": 100,
      "unit": "%",
      "deadline": "YYYY-MM-DD",
      "northStarId": "matching_north_star_id",
      "completed": false
    }
  ],
  "threeMonth": [
    {
      "id": "g_short_slug",
      "name": "checkpoint name",
      "progress": 0,
      "target": 100,
      "unit": "%",
      "deadline": "YYYY-MM-DD",
      "northStarId": "matching_north_star_id",
      "completed": false
    }
  ],
  "linkedHabits": [
    {
      "habitId": "wake_up",
      "northStarId": "matching_north_star_id"
    }
  ]
}

Rules:
- Today is {{TODAY}}.
- Set sixMonth deadlines roughly within the next 6 months.
- Set threeMonth deadlines roughly within the next 3 months.
- Use only these habit ids in linkedHabits:
  ["wake_up","deep_learning","reading","gym","youtube","walk","sleep"]
- Use realistic targets and units.
- Keep ids short, stable, and slug-like.
- Every sixMonth and threeMonth goal must map to a valid northStarId.
- Every northStar should ideally have at least one linked habit.

When you are ready to output the final result, respond with ONLY the JSON object.`;
