// ============================================================================
// Medicines the patient may already be taking.
//
// DEMO DATA. This is a hand-built list of common UK medicines — enough to make
// the search behave truthfully in a demo, nowhere near a prescribing-grade
// dictionary. Production must read the NHS dm+d (dictionary of medicines and
// devices) or the BNF API: ~120k entries, kept current, with the strength and
// form attached. Free text stays allowed either way, because the list will
// always miss something the patient is actually on.
//
// `glp1` marks entries where co-prescription changes what a prescriber does
// with a GLP-1 — those surface as a flag on the case rather than a block.
// ============================================================================

export interface Medicine {
  name: string;
  /** BNF-ish class, shown as the search hint */
  cls: string;
  /** why it matters alongside a GLP-1 */
  glp1?: string;
}

export const MEDICINES: Medicine[] = [
  // ---- Diabetes ----------------------------------------------------------
  { name: "Insulin glargine (Lantus, Toujeo)", cls: "Diabetes · long-acting insulin", glp1: "Hypoglycaemia risk — dose review needed" },
  { name: "Insulin aspart (NovoRapid, Fiasp)", cls: "Diabetes · rapid insulin", glp1: "Hypoglycaemia risk — dose review needed" },
  { name: "Insulin degludec (Tresiba)", cls: "Diabetes · long-acting insulin", glp1: "Hypoglycaemia risk — dose review needed" },
  { name: "Insulin detemir (Levemir)", cls: "Diabetes · long-acting insulin", glp1: "Hypoglycaemia risk — dose review needed" },
  { name: "Insulin lispro (Humalog)", cls: "Diabetes · rapid insulin", glp1: "Hypoglycaemia risk — dose review needed" },
  { name: "Gliclazide", cls: "Diabetes · sulfonylurea", glp1: "Hypoglycaemia risk — dose review needed" },
  { name: "Glimepiride", cls: "Diabetes · sulfonylurea", glp1: "Hypoglycaemia risk — dose review needed" },
  { name: "Glipizide", cls: "Diabetes · sulfonylurea", glp1: "Hypoglycaemia risk — dose review needed" },
  { name: "Metformin", cls: "Diabetes · biguanide" },
  { name: "Metformin MR", cls: "Diabetes · biguanide" },
  { name: "Sitagliptin (Januvia)", cls: "Diabetes · DPP-4 inhibitor", glp1: "Overlapping mechanism — usually stopped" },
  { name: "Linagliptin (Trajenta)", cls: "Diabetes · DPP-4 inhibitor", glp1: "Overlapping mechanism — usually stopped" },
  { name: "Alogliptin (Vipidia)", cls: "Diabetes · DPP-4 inhibitor", glp1: "Overlapping mechanism — usually stopped" },
  { name: "Empagliflozin (Jardiance)", cls: "Diabetes · SGLT2 inhibitor" },
  { name: "Dapagliflozin (Forxiga)", cls: "Diabetes · SGLT2 inhibitor" },
  { name: "Canagliflozin (Invokana)", cls: "Diabetes · SGLT2 inhibitor" },
  { name: "Pioglitazone", cls: "Diabetes · thiazolidinedione" },
  { name: "Dulaglutide (Trulicity)", cls: "Diabetes · GLP-1 agonist", glp1: "Another GLP-1 — cannot be taken alongside" },
  { name: "Exenatide (Byetta, Bydureon)", cls: "Diabetes · GLP-1 agonist", glp1: "Another GLP-1 — cannot be taken alongside" },
  { name: "Semaglutide oral (Rybelsus)", cls: "Diabetes · GLP-1 agonist", glp1: "Another GLP-1 — cannot be taken alongside" },

  // ---- Cardiovascular ----------------------------------------------------
  { name: "Amlodipine", cls: "Cardiovascular · calcium channel blocker" },
  { name: "Ramipril", cls: "Cardiovascular · ACE inhibitor" },
  { name: "Lisinopril", cls: "Cardiovascular · ACE inhibitor" },
  { name: "Perindopril", cls: "Cardiovascular · ACE inhibitor" },
  { name: "Enalapril", cls: "Cardiovascular · ACE inhibitor" },
  { name: "Losartan", cls: "Cardiovascular · ARB" },
  { name: "Candesartan", cls: "Cardiovascular · ARB" },
  { name: "Irbesartan", cls: "Cardiovascular · ARB" },
  { name: "Valsartan", cls: "Cardiovascular · ARB" },
  { name: "Bisoprolol", cls: "Cardiovascular · beta blocker", glp1: "Can mask the warning signs of hypoglycaemia" },
  { name: "Atenolol", cls: "Cardiovascular · beta blocker", glp1: "Can mask the warning signs of hypoglycaemia" },
  { name: "Propranolol", cls: "Cardiovascular · beta blocker", glp1: "Can mask the warning signs of hypoglycaemia" },
  { name: "Carvedilol", cls: "Cardiovascular · beta blocker" },
  { name: "Metoprolol", cls: "Cardiovascular · beta blocker" },
  { name: "Nebivolol", cls: "Cardiovascular · beta blocker" },
  { name: "Doxazosin", cls: "Cardiovascular · alpha blocker" },
  { name: "Indapamide", cls: "Cardiovascular · thiazide-like diuretic" },
  { name: "Bendroflumethiazide", cls: "Cardiovascular · thiazide diuretic" },
  { name: "Furosemide", cls: "Cardiovascular · loop diuretic", glp1: "Dehydration risk if vomiting or diarrhoea" },
  { name: "Bumetanide", cls: "Cardiovascular · loop diuretic", glp1: "Dehydration risk if vomiting or diarrhoea" },
  { name: "Spironolactone", cls: "Cardiovascular · aldosterone antagonist" },
  { name: "Digoxin", cls: "Cardiovascular · cardiac glycoside" },
  { name: "Isosorbide mononitrate", cls: "Cardiovascular · nitrate" },
  { name: "Glyceryl trinitrate (GTN spray)", cls: "Cardiovascular · nitrate" },
  { name: "Ivabradine", cls: "Cardiovascular · sinus node inhibitor" },
  { name: "Diltiazem", cls: "Cardiovascular · calcium channel blocker" },
  { name: "Verapamil", cls: "Cardiovascular · calcium channel blocker" },
  { name: "Atorvastatin", cls: "Lipids · statin" },
  { name: "Simvastatin", cls: "Lipids · statin" },
  { name: "Rosuvastatin", cls: "Lipids · statin" },
  { name: "Pravastatin", cls: "Lipids · statin" },
  { name: "Ezetimibe", cls: "Lipids · cholesterol absorption inhibitor" },
  { name: "Fenofibrate", cls: "Lipids · fibrate" },
  { name: "Bezafibrate", cls: "Lipids · fibrate" },

  // ---- Anticoagulants & antiplatelets ------------------------------------
  { name: "Warfarin", cls: "Anticoagulant · vitamin K antagonist", glp1: "Delayed gastric emptying can shift INR — monitor" },
  { name: "Apixaban (Eliquis)", cls: "Anticoagulant · DOAC" },
  { name: "Rivaroxaban (Xarelto)", cls: "Anticoagulant · DOAC" },
  { name: "Edoxaban (Lixiana)", cls: "Anticoagulant · DOAC" },
  { name: "Dabigatran (Pradaxa)", cls: "Anticoagulant · DOAC" },
  { name: "Clopidogrel", cls: "Antiplatelet" },
  { name: "Aspirin 75 mg", cls: "Antiplatelet" },
  { name: "Ticagrelor (Brilique)", cls: "Antiplatelet" },
  { name: "Dipyridamole", cls: "Antiplatelet" },
  { name: "Enoxaparin (Clexane)", cls: "Anticoagulant · LMWH" },

  // ---- Mental health -----------------------------------------------------
  { name: "Sertraline", cls: "Mental health · SSRI" },
  { name: "Fluoxetine", cls: "Mental health · SSRI" },
  { name: "Citalopram", cls: "Mental health · SSRI" },
  { name: "Escitalopram", cls: "Mental health · SSRI" },
  { name: "Paroxetine", cls: "Mental health · SSRI" },
  { name: "Venlafaxine", cls: "Mental health · SNRI" },
  { name: "Duloxetine", cls: "Mental health · SNRI" },
  { name: "Mirtazapine", cls: "Mental health · antidepressant" },
  { name: "Amitriptyline", cls: "Mental health · tricyclic" },
  { name: "Nortriptyline", cls: "Mental health · tricyclic" },
  { name: "Trazodone", cls: "Mental health · antidepressant" },
  { name: "Bupropion (Zyban)", cls: "Mental health · antidepressant" },
  { name: "Lithium", cls: "Mental health · mood stabiliser", glp1: "Dehydration from vomiting can raise lithium levels" },
  { name: "Quetiapine", cls: "Mental health · antipsychotic" },
  { name: "Olanzapine", cls: "Mental health · antipsychotic" },
  { name: "Risperidone", cls: "Mental health · antipsychotic" },
  { name: "Aripiprazole", cls: "Mental health · antipsychotic" },
  { name: "Haloperidol", cls: "Mental health · antipsychotic" },
  { name: "Clozapine", cls: "Mental health · antipsychotic" },
  { name: "Diazepam", cls: "Mental health · benzodiazepine" },
  { name: "Lorazepam", cls: "Mental health · benzodiazepine" },
  { name: "Zopiclone", cls: "Mental health · hypnotic" },
  { name: "Promethazine", cls: "Mental health · sedating antihistamine" },
  { name: "Methylphenidate (Concerta, Medikinet)", cls: "ADHD · stimulant", glp1: "Both suppress appetite — monitor weight loss rate" },
  { name: "Lisdexamfetamine (Elvanse)", cls: "ADHD · stimulant", glp1: "Both suppress appetite — monitor weight loss rate" },
  { name: "Atomoxetine", cls: "ADHD · non-stimulant" },

  // ---- Pain & inflammation -----------------------------------------------
  { name: "Paracetamol", cls: "Analgesia" },
  { name: "Ibuprofen", cls: "Analgesia · NSAID" },
  { name: "Naproxen", cls: "Analgesia · NSAID" },
  { name: "Diclofenac", cls: "Analgesia · NSAID" },
  { name: "Codeine", cls: "Analgesia · opioid", glp1: "Adds to constipation" },
  { name: "Co-codamol", cls: "Analgesia · opioid combination", glp1: "Adds to constipation" },
  { name: "Dihydrocodeine", cls: "Analgesia · opioid", glp1: "Adds to constipation" },
  { name: "Tramadol", cls: "Analgesia · opioid", glp1: "Adds to constipation" },
  { name: "Morphine (Zomorph, Oramorph)", cls: "Analgesia · opioid", glp1: "Slows gastric emptying further" },
  { name: "Oxycodone", cls: "Analgesia · opioid", glp1: "Slows gastric emptying further" },
  { name: "Gabapentin", cls: "Neuropathic pain" },
  { name: "Pregabalin", cls: "Neuropathic pain" },
  { name: "Amitriptyline (low dose, pain)", cls: "Neuropathic pain" },
  { name: "Colchicine", cls: "Gout" },
  { name: "Allopurinol", cls: "Gout" },
  { name: "Sumatriptan", cls: "Migraine · triptan" },
  { name: "Rizatriptan", cls: "Migraine · triptan" },
  { name: "Topiramate", cls: "Migraine prophylaxis / epilepsy", glp1: "Also causes weight loss — monitor combined effect" },

  // ---- Gastrointestinal --------------------------------------------------
  { name: "Omeprazole", cls: "Gastrointestinal · PPI" },
  { name: "Lansoprazole", cls: "Gastrointestinal · PPI" },
  { name: "Pantoprazole", cls: "Gastrointestinal · PPI" },
  { name: "Esomeprazole", cls: "Gastrointestinal · PPI" },
  { name: "Ranitidine", cls: "Gastrointestinal · H2 blocker" },
  { name: "Famotidine", cls: "Gastrointestinal · H2 blocker" },
  { name: "Gaviscon", cls: "Gastrointestinal · antacid" },
  { name: "Mebeverine", cls: "Gastrointestinal · antispasmodic" },
  { name: "Buscopan (hyoscine butylbromide)", cls: "Gastrointestinal · antispasmodic" },
  { name: "Loperamide", cls: "Gastrointestinal · antidiarrhoeal" },
  { name: "Senna", cls: "Gastrointestinal · laxative" },
  { name: "Lactulose", cls: "Gastrointestinal · laxative" },
  { name: "Macrogol (Movicol, Laxido)", cls: "Gastrointestinal · laxative" },
  { name: "Bisacodyl", cls: "Gastrointestinal · laxative" },
  { name: "Domperidone", cls: "Gastrointestinal · prokinetic", glp1: "Opposes the delayed gastric emptying GLP-1s cause" },
  { name: "Metoclopramide", cls: "Gastrointestinal · prokinetic", glp1: "Opposes the delayed gastric emptying GLP-1s cause" },
  { name: "Ondansetron", cls: "Gastrointestinal · antiemetic" },
  { name: "Mesalazine", cls: "Gastrointestinal · aminosalicylate" },
  { name: "Creon (pancreatin)", cls: "Gastrointestinal · pancreatic enzyme", glp1: "Suggests pancreatic disease — needs review" },
  { name: "Ursodeoxycholic acid", cls: "Gastrointestinal · bile acid" },

  // ---- Respiratory -------------------------------------------------------
  { name: "Salbutamol (Ventolin)", cls: "Respiratory · reliever inhaler" },
  { name: "Beclometasone (Clenil, Qvar)", cls: "Respiratory · steroid inhaler" },
  { name: "Fluticasone/salmeterol (Seretide)", cls: "Respiratory · combination inhaler" },
  { name: "Budesonide/formoterol (Symbicort)", cls: "Respiratory · combination inhaler" },
  { name: "Fostair", cls: "Respiratory · combination inhaler" },
  { name: "Trelegy Ellipta", cls: "Respiratory · triple inhaler" },
  { name: "Tiotropium (Spiriva)", cls: "Respiratory · LAMA inhaler" },
  { name: "Montelukast", cls: "Respiratory · leukotriene antagonist" },
  { name: "Carbocisteine", cls: "Respiratory · mucolytic" },
  { name: "Prednisolone", cls: "Corticosteroid · oral", glp1: "Raises blood glucose — affects diabetes control" },

  // ---- Endocrine & hormones ----------------------------------------------
  { name: "Levothyroxine", cls: "Endocrine · thyroid hormone", glp1: "Absorption can shift — recheck TFTs after titration" },
  { name: "Carbimazole", cls: "Endocrine · antithyroid" },
  { name: "Hydrocortisone (replacement)", cls: "Endocrine · steroid replacement", glp1: "Sick-day rules matter if vomiting" },
  { name: "Testosterone gel (Testogel, Tostran)", cls: "Endocrine · androgen" },
  { name: "Combined oral contraceptive pill", cls: "Contraception", glp1: "Mounjaro can reduce efficacy — barrier method for 4 weeks" },
  { name: "Progesterone-only pill (Cerazette, Cerelle)", cls: "Contraception", glp1: "Mounjaro can reduce efficacy — barrier method for 4 weeks" },
  { name: "Contraceptive implant (Nexplanon)", cls: "Contraception" },
  { name: "Hormonal coil (Mirena, Kyleena)", cls: "Contraception" },
  { name: "HRT — oestrogen patch (Evorel, Estradot)", cls: "HRT" },
  { name: "HRT — oestrogen gel (Oestrogel, Sandrena)", cls: "HRT" },
  { name: "HRT — combined tablet (Femoston, Kliovance)", cls: "HRT" },
  { name: "Utrogestan (micronised progesterone)", cls: "HRT" },
  { name: "Tibolone (Livial)", cls: "HRT" },
  { name: "Desmopressin", cls: "Endocrine · antidiuretic" },
  { name: "Cabergoline", cls: "Endocrine · dopamine agonist" },

  // ---- Weight management (non-GLP-1) --------------------------------------
  { name: "Orlistat (Xenical, Alli)", cls: "Weight management · lipase inhibitor", glp1: "Usually stopped when a GLP-1 starts" },
  { name: "Naltrexone/bupropion (Mysimba)", cls: "Weight management", glp1: "Usually stopped when a GLP-1 starts" },

  // ---- Urology -----------------------------------------------------------
  { name: "Tamsulosin", cls: "Urology · alpha blocker" },
  { name: "Finasteride", cls: "Urology / hair loss · 5-alpha reductase" },
  { name: "Dutasteride", cls: "Urology · 5-alpha reductase" },
  { name: "Solifenacin (Vesicare)", cls: "Urology · antimuscarinic" },
  { name: "Oxybutynin", cls: "Urology · antimuscarinic" },
  { name: "Mirabegron (Betmiga)", cls: "Urology · beta-3 agonist" },
  { name: "Sildenafil (Viagra)", cls: "Urology · PDE5 inhibitor" },
  { name: "Tadalafil (Cialis)", cls: "Urology · PDE5 inhibitor" },

  // ---- Neurology ---------------------------------------------------------
  { name: "Levetiracetam (Keppra)", cls: "Neurology · antiepileptic" },
  { name: "Lamotrigine", cls: "Neurology · antiepileptic" },
  { name: "Sodium valproate (Epilim)", cls: "Neurology · antiepileptic" },
  { name: "Carbamazepine", cls: "Neurology · antiepileptic" },
  { name: "Phenytoin", cls: "Neurology · antiepileptic" },
  { name: "Levodopa/carbidopa (Sinemet, Madopar)", cls: "Neurology · Parkinson's", glp1: "Delayed emptying can alter absorption" },
  { name: "Donepezil", cls: "Neurology · dementia" },
  { name: "Riluzole", cls: "Neurology · motor neurone disease" },
  { name: "Baclofen", cls: "Neurology · muscle relaxant" },

  // ---- Immunology & specialist -------------------------------------------
  { name: "Methotrexate", cls: "Immunosuppressant · DMARD" },
  { name: "Hydroxychloroquine", cls: "Immunosuppressant · DMARD" },
  { name: "Sulfasalazine", cls: "Immunosuppressant · DMARD" },
  { name: "Azathioprine", cls: "Immunosuppressant" },
  { name: "Mycophenolate", cls: "Immunosuppressant" },
  { name: "Ciclosporin", cls: "Immunosuppressant" },
  { name: "Tacrolimus", cls: "Immunosuppressant" },
  { name: "Adalimumab (Humira)", cls: "Biologic · anti-TNF" },
  { name: "Etanercept (Enbrel)", cls: "Biologic · anti-TNF" },
  { name: "Infliximab (Remicade)", cls: "Biologic · anti-TNF" },
  { name: "Rituximab", cls: "Biologic" },
  { name: "Tamoxifen", cls: "Oncology · hormone therapy" },
  { name: "Anastrozole", cls: "Oncology · aromatase inhibitor" },
  { name: "Letrozole", cls: "Oncology · aromatase inhibitor" },
  { name: "Bicalutamide", cls: "Oncology · anti-androgen" },

  // ---- Anti-infectives ---------------------------------------------------
  { name: "Amoxicillin", cls: "Antibiotic · penicillin" },
  { name: "Flucloxacillin", cls: "Antibiotic · penicillin" },
  { name: "Co-amoxiclav", cls: "Antibiotic · penicillin combination" },
  { name: "Doxycycline", cls: "Antibiotic · tetracycline" },
  { name: "Lymecycline", cls: "Antibiotic · tetracycline" },
  { name: "Clarithromycin", cls: "Antibiotic · macrolide" },
  { name: "Azithromycin", cls: "Antibiotic · macrolide" },
  { name: "Trimethoprim", cls: "Antibiotic" },
  { name: "Nitrofurantoin", cls: "Antibiotic" },
  { name: "Ciprofloxacin", cls: "Antibiotic · quinolone" },
  { name: "Metronidazole", cls: "Antibiotic" },
  { name: "Fluconazole", cls: "Antifungal" },
  { name: "Terbinafine", cls: "Antifungal" },
  { name: "Aciclovir", cls: "Antiviral" },
  { name: "Valaciclovir", cls: "Antiviral" },
  { name: "Truvada / PrEP (emtricitabine, tenofovir)", cls: "Antiviral · HIV prevention" },
  { name: "Antiretroviral therapy (HIV)", cls: "Antiviral · HIV" },

  // ---- Allergy, skin, eyes -----------------------------------------------
  { name: "Cetirizine", cls: "Allergy · antihistamine" },
  { name: "Loratadine", cls: "Allergy · antihistamine" },
  { name: "Fexofenadine", cls: "Allergy · antihistamine" },
  { name: "Chlorphenamine (Piriton)", cls: "Allergy · antihistamine" },
  { name: "Adrenaline auto-injector (EpiPen, Jext)", cls: "Allergy · emergency" },
  { name: "Beclometasone nasal spray", cls: "Allergy · nasal steroid" },
  { name: "Isotretinoin (Roaccutane)", cls: "Dermatology · retinoid" },
  { name: "Topical steroid cream (hydrocortisone, Betnovate)", cls: "Dermatology" },
  { name: "Latanoprost eye drops", cls: "Ophthalmic · glaucoma" },
  { name: "Timolol eye drops", cls: "Ophthalmic · glaucoma" },

  // ---- Supplements a prescriber still wants to see -------------------------
  { name: "Vitamin D (colecalciferol)", cls: "Supplement" },
  { name: "Folic acid", cls: "Supplement" },
  { name: "Ferrous fumarate / sulfate (iron)", cls: "Supplement" },
  { name: "Vitamin B12 (hydroxocobalamin)", cls: "Supplement" },
  { name: "Adcal-D3 / calcium", cls: "Supplement" },
  { name: "Thiamine", cls: "Supplement" },
];

/** Ranked search: name prefix beats name substring beats class match. */
export function searchMedicines(query: string, exclude: string[] = [], limit = 8): Medicine[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const taken = new Set(exclude);
  const scored: { m: Medicine; score: number }[] = [];

  for (const m of MEDICINES) {
    if (taken.has(m.name)) continue;
    const name = m.name.toLowerCase();
    let score = -1;
    if (name.startsWith(q)) score = 0;
    else if (name.includes(q)) score = 1;
    else if (m.cls.toLowerCase().includes(q)) score = 2;
    if (score >= 0) scored.push({ m, score });
  }

  return scored
    .sort((a, b) => a.score - b.score || a.m.name.localeCompare(b.m.name))
    .slice(0, limit)
    .map((s) => s.m);
}

export function medicineByName(name: string): Medicine | undefined {
  return MEDICINES.find((m) => m.name === name);
}

/** Anything the patient listed that a prescriber must weigh against a GLP-1. */
export function interactionFlags(names: string[]): { name: string; note: string }[] {
  return names
    .map((n) => ({ n, m: medicineByName(n) }))
    .filter((x) => x.m?.glp1)
    .map((x) => ({ name: x.n, note: x.m!.glp1! }));
}
