// The blocks a topic MDX file may use (no imports needed in MDX). Each tab renders the same
// MDX with a different map, so one file feeds the Formulas, Properties and Problems tabs.
import CheatFormula from './CheatFormula.astro';
import Definition from './Definition.astro';
import Formula from './Formula.astro';
import Formulas from './Formulas.astro';
import Hide from './Hide.astro';
import Problem from './Problem.astro';
import Problems from './Problems.astro';
import Proof from './Proof.astro';
import Properties from './Properties.astro';
import Property from './Property.astro';
import Remark from './Remark.astro';
import Step from './Step.astro';

const blocks = { Formula, Property, Proof, Step, Problem };
export const formulasView = { ...blocks, Formulas, Definition: Hide, Properties: Hide, Remark: Hide, Problems: Hide };
export const propertiesView = { ...blocks, Formulas: Hide, Definition, Properties, Remark, Problems: Hide };
export const problemsView = { ...blocks, Formulas: Hide, Definition: Hide, Properties: Hide, Remark: Hide, Problems };

/** Cheat sheet: formulas only. */
export const cheatView = { Formulas, Formula: CheatFormula, Definition: Hide, Properties: Hide, Remark: Hide, Property: Hide, Proof: Hide, Step: Hide, Problems: Hide, Problem: Hide };
