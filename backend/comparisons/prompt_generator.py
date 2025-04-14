
from typing import Dict, Any, List

class PromptGenerator:
    """Generates prompts for LLM document comparison"""
    
    def generate_criterion_prompt(self, doc1_name: str, doc2_name: str, 
                                 doc1_section: str, doc2_section: str,
                                 criterion: Dict[str, Any]) -> str:
        """
        Generate a prompt for evaluating a single criterion.
        
        Args:
            doc1_name: Name of first document
            doc2_name: Name of second document
            doc1_section: Relevant section from first document
            doc2_section: Relevant section from second document
            criterion: The criterion dictionary
            
        Returns:
            Prompt string
        """
        # Build the prompt for this criterion only
        prompt = f"""
        Evaluate the following two documents specifically on this criterion: {criterion['name']}.
        
        # Documents:
        - Document A: {doc1_name}
        - Document B: {doc2_name}
        
        # Criterion Information:
        Name: {criterion['name']}
        Weight: {criterion['weight']}%
        Description: {criterion['description']}
        
        # Scoring Rubric:
        """
        
        # Add rubric scoring levels
        if 'scoring_levels' in criterion and criterion['scoring_levels']:
            for level, desc in criterion['scoring_levels'].items():
                if isinstance(level, str) and level.isdigit():
                    level = int(level)
                prompt += f"  {level}: {desc}\n"
        else:
            # Default rubric - only include once
            prompt += "  1: Poor - Does not meet the criterion requirements\n"
            prompt += "  2: Fair - Meets some requirements with significant gaps\n"
            prompt += "  3: Good - Meets most requirements\n"
            prompt += "  4: Very Good - Meets all requirements\n"
            prompt += "  5: Excellent - Exceeds requirements\n"
        
        # Add relevant sections
        prompt += f"""
        # Document A Relevant Section for {criterion['name']}:
        {doc1_section}
        
        # Document B Relevant Section for {criterion['name']}:
        {doc2_section}
        """
        
        # Add detailed evaluation instructions
        prompt += """
        Perform a thorough evaluation following these steps:
        
        1. Analyse Document A and Document B
           - Carefully assess Document A and Document B against the rubric criteria
           - Provide detailed reasoning with specific examples from the text
           - Assign a score from 1-5 based strictly on the rubric
        
        2. Comparative Analysis:
           - Directly compare how each document addresses this criterion
           - Highlight key differences in approach and effectiveness
           - Consider both qualitative and quantitative factors
           - Determine which document better satisfies the criterion
        
        3. Decision Reasoning:
           - Explain your decision process in detail
           - Justify why one document scores higher than the other
           - Reference specific content from both documents
           - Consider how well each meets the specific requirements of this criterion
        
        Respond with a JSON object containing these fields:
        {
            "criterion_name": "%s",
            "document_a_score": [score between 1-5],
            "document_a_analysis": [detailed analysis with specific examples],
            "document_b_score": [score between 1-5],
            "document_b_analysis": [detailed analysis with specific examples],
            "comparative_analysis": [direct side-by-side comparison],
            "reasoning": [detailed justification for your decision],
            "winner": [either "A" or "B" or "Tie" if truly equal]
        }
        """ % criterion['name']
        
        return prompt

    def generate_custom_prompt(self, doc1_name: str, doc2_name: str, 
                              doc1_section: str, doc2_section: str,
                              custom_prompt_text: str) -> str:
        """
        Generate a prompt for evaluation based on a custom prompt.
        
        Args:
            doc1_name: Name of first document
            doc2_name: Name of second document
            doc1_section: Content from first document
            doc2_section: Content from second document
            custom_prompt_text: The custom evaluation instructions
            
        Returns:
            Prompt string
        """
        prompt = f"""
        Compare and evaluate the following two documents based on the provided instructions.
        
        # Documents:
        - Document A: {doc1_name}
        - Document B: {doc2_name}
        
        # Document A Content:
        {doc1_section}
        
        # Document B Content:
        {doc2_section}
        
        # Evaluation Instructions:
        {custom_prompt_text}
        
        # Evaluation Guidelines:
        - Thoroughly analyze both documents based on the given instructions
        - Consider all aspects requested in the evaluation instructions
        - Be objective and fair in your assessment
        - Use specific examples from the text to support your evaluation
        - Score each document on a scale of 1-5 (where 1 is poor and 5 is excellent)
        - Determine a clear winner or declare a tie if truly equal
        
        Respond with a JSON object containing these fields:
        {{
            "criterion_name": "Custom Evaluation",
            "document_a_score": [score between 1-5],
            "document_a_analysis": [detailed analysis with specific examples],
            "document_b_score": [score between 1-5],
            "document_b_analysis": [detailed analysis with specific examples],
            "comparative_analysis": [direct side-by-side comparison based on the custom instructions],
            "reasoning": [detailed justification for your decision],
            "winner": [either "A" or "B" or "Tie" if truly equal]
        }}
        """
        
        return prompt
