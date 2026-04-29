export type Lang = "en" | "es";

export const SUPPORTED_LANGS: Lang[] = ["en", "es"];

const dictionaries = {
  en: {
    "header.beta": "Beta",
    "header.save": "Save",
    "header.downloadPdf": "Download PDF",
    "header.signInTooltip": "Sign in to save your family tree",
    "header.signOut": "Sign Out",
    "header.signInGoogle": "Sign in with Google",
    "header.themeSwitchToDark": "Switch to dark mode",
    "header.themeSwitchToLight": "Switch to light mode",
    "header.languageSwitch": "Switch language",

    "sidebar.tab.personal": "Personal",
    "sidebar.tab.relations": "Relations",
    "sidebar.tab.contact": "Contact",
    "sidebar.tab.biography": "Biography",

    "sidebar.addPartner": "+ Partner",
    "sidebar.addParents": "+ Parents",
    "sidebar.addChild": "+ Child",
    "sidebar.deletePerson": "Delete person",
    "sidebar.deleteNamed": "Delete {name}",
    "sidebar.selectPerson": "Select a person",
    "sidebar.bornShort": "b. {date}",

    "sidebar.givenNames": "Given names:",
    "sidebar.surname": "Surname:",
    "sidebar.birthSurname": "Birth surname:",
    "sidebar.gender": "Gender:",
    "sidebar.gender.female": "Female",
    "sidebar.gender.male": "Male",
    "sidebar.gender.other": "Other",
    "sidebar.born": "Born:",
    "sidebar.died": "Died:",
    "sidebar.in": "in:",
    "sidebar.bornDateAria": "Born date",
    "sidebar.diedDateAria": "Died date",
    "sidebar.placePlaceholder": "Place",
    "sidebar.email": "Email:",
    "sidebar.phone": "Phone:",
    "sidebar.address": "Address:",

    "sidebar.peopleCount": "People ({count})",
    "sidebar.noPeople": "No people yet.",
    "sidebar.noRelations": "No relations yet.",
    "sidebar.unnamed": "Unnamed",

    "sidebar.relations.Partners": "Partners",
    "sidebar.relations.Parents": "Parents",
    "sidebar.relations.Children": "Children",
    "sidebar.relations.Siblings": "Siblings",
    "sidebar.relations.Grandparents": "Grandparents",
    "sidebar.relations.Grandchildren": "Grandchildren",
    "sidebar.relations.AuntsUncles": "Aunts & Uncles",
    "sidebar.relations.Cousins": "Cousins",
    "sidebar.relations.NephewsNieces": "Nephews & Nieces",

    "biography.placeholder": "Write biography details here...",

    "canvas.dad": "Dad",
    "canvas.mom": "Mom",
    "canvas.me": "Me",
    "canvas.newPerson": "New Person",
    "canvas.savedSuccess": "Family tree saved successfully!",
    "canvas.saveFailed": "Failed to save family tree: {error}",
    "canvas.saveError": "An error occurred while saving.",
    "canvas.pdfError": "An error occurred while generating the PDF.",

    "datepicker.pick": "Pick a date",
    "datepicker.clear": "Clear date",
  },
  es: {
    "header.beta": "Beta",
    "header.save": "Guardar",
    "header.downloadPdf": "Descargar PDF",
    "header.signInTooltip": "Inicia sesión para guardar tu árbol genealógico",
    "header.signOut": "Cerrar sesión",
    "header.signInGoogle": "Iniciar sesión con Google",
    "header.themeSwitchToDark": "Cambiar a modo oscuro",
    "header.themeSwitchToLight": "Cambiar a modo claro",
    "header.languageSwitch": "Cambiar idioma",

    "sidebar.tab.personal": "Personal",
    "sidebar.tab.relations": "Relaciones",
    "sidebar.tab.contact": "Contacto",
    "sidebar.tab.biography": "Biografía",

    "sidebar.addPartner": "+ Pareja",
    "sidebar.addParents": "+ Padres",
    "sidebar.addChild": "+ Hijo",
    "sidebar.deletePerson": "Eliminar persona",
    "sidebar.deleteNamed": "Eliminar a {name}",
    "sidebar.selectPerson": "Selecciona una persona",
    "sidebar.bornShort": "n. {date}",

    "sidebar.givenNames": "Nombres:",
    "sidebar.surname": "Apellido:",
    "sidebar.birthSurname": "Apellido de nacimiento:",
    "sidebar.gender": "Género:",
    "sidebar.gender.female": "Femenino",
    "sidebar.gender.male": "Masculino",
    "sidebar.gender.other": "Otro",
    "sidebar.born": "Nacido:",
    "sidebar.died": "Falleció:",
    "sidebar.in": "en:",
    "sidebar.bornDateAria": "Fecha de nacimiento",
    "sidebar.diedDateAria": "Fecha de fallecimiento",
    "sidebar.placePlaceholder": "Lugar",
    "sidebar.email": "Correo:",
    "sidebar.phone": "Teléfono:",
    "sidebar.address": "Dirección:",

    "sidebar.peopleCount": "Personas ({count})",
    "sidebar.noPeople": "Aún no hay personas.",
    "sidebar.noRelations": "Aún no hay relaciones.",
    "sidebar.unnamed": "Sin nombre",

    "sidebar.relations.Partners": "Parejas",
    "sidebar.relations.Parents": "Padres",
    "sidebar.relations.Children": "Hijos",
    "sidebar.relations.Siblings": "Hermanos",
    "sidebar.relations.Grandparents": "Abuelos",
    "sidebar.relations.Grandchildren": "Nietos",
    "sidebar.relations.AuntsUncles": "Tíos y tías",
    "sidebar.relations.Cousins": "Primos",
    "sidebar.relations.NephewsNieces": "Sobrinos y sobrinas",

    "biography.placeholder": "Escribe los detalles de la biografía aquí...",

    "canvas.dad": "Papá",
    "canvas.mom": "Mamá",
    "canvas.me": "Yo",
    "canvas.newPerson": "Nueva persona",
    "canvas.savedSuccess": "¡Árbol genealógico guardado correctamente!",
    "canvas.saveFailed": "Error al guardar el árbol genealógico: {error}",
    "canvas.saveError": "Ocurrió un error al guardar.",
    "canvas.pdfError": "Ocurrió un error al generar el PDF.",

    "datepicker.pick": "Elegir fecha",
    "datepicker.clear": "Borrar fecha",
  },
} as const;

export type TranslationKey = keyof (typeof dictionaries)["en"];

export const translations: Record<Lang, Record<TranslationKey, string>> = dictionaries;

export const RELATION_KEY_TO_TRANSLATION: Record<string, TranslationKey> = {
  Partners: "sidebar.relations.Partners",
  Parents: "sidebar.relations.Parents",
  Children: "sidebar.relations.Children",
  Siblings: "sidebar.relations.Siblings",
  Grandparents: "sidebar.relations.Grandparents",
  Grandchildren: "sidebar.relations.Grandchildren",
  "Aunts & Uncles": "sidebar.relations.AuntsUncles",
  Cousins: "sidebar.relations.Cousins",
  "Nephews & Nieces": "sidebar.relations.NephewsNieces",
};

export function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}
