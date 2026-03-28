export const C_FUNNY = [
  "Ce vitrail est plus stylé qu'un coucher de soleil à Bali.",
  "Même un musée serait jaloux de ça.",
  "Ce vitrail a plus de classe que la plupart des salons bourgeois.",
  "Franchement, les cathédrales peuvent aller se rhabiller.",
  "C'est le genre de truc qui fait pleurer les gens sans qu'ils sachent pourquoi.",
  "Si la lumière du matin passe là-dedans, les voisins vont frapper à la porte.",
  "Ce vitrail ferait passer n'importe quelle fenêtre IKEA pour une honte nationale.",
  "On est clairement dans la catégorie 'œuvre que les enfants hériteront'.",
  "Louis Comfort Tiffany himself aurait hoché la tête avec respect.",
  "Ce truc pourrait faire la une d'un magazine que personne ne lit mais tout le monde expose.",
];

export const C_ABSURD = [
  "Ce vitrail pourrait probablement résoudre des équations.",
  "Ce truc mérite presque un passeport.",
  "Je suis presque sûr que ce vitrail a une personnalité.",
  "Le verre a atteint un niveau de conscience supérieur.",
  "Les photons qui passent là-dedans ressortent changés, philosophiquement.",
  "Ce vitrail a probablement des opinions sur le réchauffement climatique.",
  "Je pense que la lumière du soleil a signé un contrat exclusif avec cette pièce.",
  "Les abeilles de la région viennent de changer leur itinéraire pour passer devant.",
  "Ce vitrail pourrait guérir une mauvaise journée. Des études le montreront bientôt.",
  "À ce niveau de qualité, le verre a arrêté d'être un matériau pour devenir un argument.",
];

export const C_ROAST = [
  { text: "On dirait un vitrail fait un lundi matin.",                                                         mood: "bored"      },
  { text: "C'est… audacieux. Très audacieux.",                                                                mood: "royal"      },
  { text: "Même une église abandonnée hésiterait.",                                                           mood: "disgusted"  },
  { text: "On sent que le vitrail a pris des décisions seul.",                                                mood: "suspicious" },
  { text: "Les couleurs ont l'air d'avoir eu une petite dispute.",                                            mood: "shocked"    },
  { text: "C'est ce qu'on appelle un style 'work in progress' assumé.",                                       mood: "skeptical"  },
  { text: "Il y a une énergie très… libre là-dedans. Très libre.",                                           mood: "confused"   },
  { text: "On voit clairement que l'artiste avait des choses à dire. On ne sait pas quoi, mais des choses.", mood: "judging"    },
  { text: "C'est courageux. Vraiment. On salue le courage.",                                                  mood: "pitying"    },
  { text: "Certains choix ont été faits. On ne dira pas lesquels.",                                           mood: "deadpan"    },
];

export const getPriceCompliments = (p: number): string[] =>
  p < 50
    ? ["Petit prix, mais gros charme.", "Budget léger, effet lourd.", "Rapport style/prix franchement criminel.", "Pour ce prix-là, c'est presque indécent de beauté."]
    : p < 200
    ? ["Là on commence à parler sérieusement.", "Ça respire le travail bien fait.", "Tu pourrais clairement vendre ça sans rougir.", "C'est le juste prix pour quelque chose qui va durer des décennies."]
    : ["OK là on est sur du luxe.", "Ça mérite une vitrine et un spot LED.", "On appelle ça une pièce de collection.", "À ce prix, la livraison devrait inclure des gants blancs."];

export interface ZoneForColor {
  color: { r: number; g: number; b: number; a: number } | null;
}

export const getColorCompliments = (zones: ZoneForColor[]): string[] => {
  const col = zones.filter(z => z.color);
  if (!col.length) return [];
  const r: string[] = [];
  if (col.some(z => z.color!.b > z.color!.r && z.color!.b > z.color!.g)) r.push("Ambiance océan, c'est propre.");
  if (col.some(z => z.color!.g > z.color!.r && z.color!.g > z.color!.b)) r.push("Ça sent la forêt, j'aime bien.");
  if (col.some(z => z.color!.r > z.color!.g && z.color!.r > z.color!.b)) r.push("Petit côté feu, ça réchauffe.");
  return r;
};