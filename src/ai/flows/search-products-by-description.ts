// 'use server';

/**
 * @fileOverview An AI agent that searches for products by description using fuzzy matching.
 *
 * - searchProductsByDescription - A function that handles the product search process.
 * - SearchProductsByDescriptionInput - The input type for the searchProductsByDescription function.
 * - SearchProductsByDescriptionOutput - The return type for the searchProductsByDescription function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SearchProductsByDescriptionInputSchema = z.object({
  description: z.string().describe('The description of the product to search for.'),
});
export type SearchProductsByDescriptionInput = z.infer<typeof SearchProductsByDescriptionInputSchema>;

const SearchProductsByDescriptionOutputSchema = z.object({
  products: z
    .array(
      z.object({
        id: z.string().describe('The unique identifier of the product.'),
        name: z.string().describe('The name of the product.'),
        description: z.string().describe('A detailed description of the product.'),
        price: z.number().describe('The price of the product.'),
      })
    )
    .describe('A list of products that match the description.'),
});
export type SearchProductsByDescriptionOutput = z.infer<typeof SearchProductsByDescriptionOutputSchema>;

export async function searchProductsByDescription(
  input: SearchProductsByDescriptionInput
): Promise<SearchProductsByDescriptionOutput> {
  return searchProductsByDescriptionFlow(input);
}

const searchProductsPrompt = ai.definePrompt({
  name: 'searchProductsPrompt',
  input: {schema: SearchProductsByDescriptionInputSchema},
  output: {schema: SearchProductsByDescriptionOutputSchema},
  prompt: `You are a helpful AI assistant that can search for products based on their description.

  The user will provide a description of the product they are looking for. You should use fuzzy matching to find the most relevant products, even if the description contains misspellings or incomplete details.

  Return a list of products that match the description.

  Description: {{{description}}}`,
});

const searchProductsByDescriptionFlow = ai.defineFlow(
  {
    name: 'searchProductsByDescriptionFlow',
    inputSchema: SearchProductsByDescriptionInputSchema,
    outputSchema: SearchProductsByDescriptionOutputSchema,
  },
  async input => {
    // Removed mock data and directly call the prompt function
    const {output} = await searchProductsPrompt(input);
    return output!;
  }
);
