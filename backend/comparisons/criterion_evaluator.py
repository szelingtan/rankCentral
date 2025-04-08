
from typing import Dict, Any
import json
from langchain_openai import OpenAI

class CriterionEvaluator:
    """Handles the evaluation of a specific criterion using LLM"""
    
    def __init__(self, openai_api_key: str):
        """
        Initialize the criterion evaluator.
        
        Args:
            openai_api_key: API key for OpenAI
        """
        self.openai_api_key = openai_api_key
    
    def evaluate(self, prompt: str, max_tokens: int) -> Dict[str, Any]:
        """
        Evaluate a criterion using the LLM.
        
        Args:
            prompt: The prompt to send to the LLM
            max_tokens: Maximum number of tokens for the LLM response
            
        Returns:
            Dictionary containing the evaluation result
        """
        # Create LLM instance for this evaluation
        llm = OpenAI(temperature=0.2, openai_api_key=self.openai_api_key, max_tokens=max_tokens)
        
        try:
            # Call LLM
            result = llm.invoke(prompt)
            
            # Process the result
            result = result.strip()
            if "```json" in result:
                result = result.split("```json")[1].split("```")[0].strip()
            elif "```" in result:
                result = result.split("```")[1].split("```")[0].strip()
            
            # Extract JSON
            json_start = result.find('{')
            json_end = result.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                result = result[json_start:json_end]
                
            # Parse the criterion evaluation
            criterion_eval = json.loads(result)
            
            # Ensure all required fields are present
            self._validate_criterion_evaluation(criterion_eval)
            
            return criterion_eval
            
        except Exception as e:
            print(f"    Error evaluating criterion: {e}")
            # Create placeholder evaluation in case of error
            return {
                "document_a_score": 0,
                "document_b_score": 0,
                "document_a_analysis": f"Error during evaluation: {str(e)}",
                "document_b_analysis": f"Error during evaluation: {str(e)}",
                "comparative_analysis": "Unable to compare due to error",
                "reasoning": f"Error occurred: {str(e)}",
                "winner": "N/A"
            }
    
    def _validate_criterion_evaluation(self, criterion_eval: Dict[str, Any]) -> None:
        """
        Ensure all required fields are present in the criterion evaluation.
        
        Args:
            criterion_eval: The criterion evaluation dictionary
        """
        required_fields = [
            'document_a_score', 'document_b_score', 'document_a_analysis', 
            'document_b_analysis', 'comparative_analysis', 'winner', 'reasoning'
        ]
        
        for field in required_fields:
            if field not in criterion_eval:
                if field.endswith('_score'):
                    criterion_eval[field] = 0
                elif field == 'winner':
                    criterion_eval[field] = 'Tie'
                else:
                    criterion_eval[field] = f"No {field.replace('_', ' ')} provided"
