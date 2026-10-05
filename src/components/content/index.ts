// The blocks a topic MDX file may use (no imports needed in MDX). Each tab renders the same
// MDX with a different map, so one file feeds the Formulas and the Properties tabs.
import Definition from './Definition.astro';
import Formula from './Formula.astro';
import Formulas from './Formulas.astro';
import Hide from './Hide.astro';
import Proof from './Proof.astro';
import Properties from './Properties.astro';
import Property from './Property.astro';
import Remark from './Remark.astro';
import Step from './Step.astro';

const blocks = { Formula, Property, Proof, Step };
export const formulasView = { ...blocks, Formulas, Definition: Hide, Properties: Hide, Remark: Hide };
export const propertiesView = { ...blocks, Formulas: Hide, Definition, Properties, Remark };
