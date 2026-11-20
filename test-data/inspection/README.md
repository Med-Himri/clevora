# Test photos for the inspection (départ / retour)

The same white car, 8 views. Upload `depart/` at the departure inspection and `retour/`
at the return inspection, one photo per tile (1-front → Avant, 2-back → Arrière,
3-left → Côté gauche, 4-right → Côté droit, 5-wheels → Roues, 6-roof → Toit,
7-interior → Intérieur, 8-trunk → Coffre).

Return photos are taken "later": the camera moved a little and the light is darker.
The AI must ignore that.

| View | New damage on the return | AI result (live test, Groq qwen, free) |
|---|---|---|
| 1 Avant | Pare-brise fissuré (en haut à droite) | ✅ glass, 95 % |
| 2 Arrière | Bosse sur le pare-chocs (à droite) | ✅ dent, 95 % |
| 3 Côté gauche | Rayure sur la portière arrière | ✅ scratch, 95 % |
| 4 Côté droit | — none | ✅ nothing found |
| 5 Roues | Jante frottée (trottoir), en bas à droite | ✅ scratch, 90 % |
| 6 Toit | — none | ✅ nothing found |
| 7 Intérieur | Tache sur le siège passager | ✅ interior, 95 % |
| 8 Coffre | Triangle de signalisation manquant | ✅ missing, 95 % |

Make them again: `node scripts/test-photos/make-inspection-photos.mjs`
