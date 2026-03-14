import { qwikify$ } from "@builder.io/qwik-react";
import { FamilyTreeCanvas } from "./FamilyTreeCanvas";

// Qwikify the React component so it can be used in Qwik.
// eagerness: "visible" means it hydrate when it scrolls into view (or right away if it's visible).
export const QFamilyTreeCanvas = qwikify$(FamilyTreeCanvas, { eagerness: "visible" });
