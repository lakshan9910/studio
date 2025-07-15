// src/ai/flows/suggest-item-search-queries.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting search queries based on partial input.
 *
 * - suggestItemSearchQueries - A function that suggests search queries for items.
 * - SuggestItemSearchQueriesInput - The input type for the suggestItemSearchQueries function.
 * - SuggestItemSearchQueriesOutput - The output type for the suggestItemSearchQueries function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestItemSearchQueriesInputSchema = z.object({
  partialInput: z
    .string()
    .describe('The partial input string to generate search queries from.'),
});
export type SuggestItemSearchQueriesInput = z.infer<
  typeof SuggestItemSearchQueriesInputSchema
>;

const SuggestItemSearchQueriesOutputSchema = z.object({
  suggestedQueries: z
    .array(z.string())
    .describe('An array of suggested search queries.'),
});
export type SuggestItemSearchQueriesOutput = z.infer<
  typeof SuggestItemSearchQueriesOutputSchema
>;

export async function suggestItemSearchQueries(
  input: SuggestItemSearchQueriesInput
): Promise<SuggestItemSearchQueriesOutput> {
  return suggestItemSearchQueriesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestItemSearchQueriesPrompt',
  input: {schema: SuggestItemSearchQueriesInputSchema},
  output: {schema: SuggestItemSearchQueriesOutputSchema},
  prompt: `You are an expert in suggesting search queries for a Point of Sale (POS) system.
  Given the following partial input, suggest search queries that a cashier might use to find the correct item.
  Consider common misspellings and incomplete details.

  Partial Input: {{{partialInput}}}

  Your suggestions should be tailored to help the cashier quickly locate the desired product.
  Return the suggested queries as an array of strings.
  `,
});

const suggestItemSearchQueriesFlow = ai.defineFlow(
  {
    name: 'suggestItemSearchQueriesFlow',
    inputSchema: SuggestItemSearchQueriesInputSchema,
    outputSchema: SuggestItemSearchQueriesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
