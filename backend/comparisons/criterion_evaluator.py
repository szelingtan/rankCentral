
from typing import Dict, Any
import json
from openai import OpenAI

class CriterionEvaluator:
    """
    Handles the evaluation of a specific criterion using LLM
    
    This class is responsible for:
    1. Sending prompts to the OpenAI API
    2. Processing the responses
    3. Ensuring valid JSON structure in the evaluation results
    """
    
    def __init__(self, openai_api_key: str, model_name: str = "gpt-4.1-mini"):
        """
        Initialize the criterion evaluator.
        
        Args:
            openai_api_key: API key for OpenAI
            model_name: The specific OpenAI model to use, defaults to gpt-4.1-mini
        """
        self.openai_api_key = openai_api_key
        self.model_name = model_name
    
    def evaluate(self, prompt: str, max_tokens: int) -> Dict[str, Any]:
        """
        Evaluate a criterion using the LLM.
        
        Args:
            prompt: The prompt to send to the LLM
            max_tokens: Maximum number of tokens for the LLM response
            
        Returns:
            Dictionary containing the evaluation result
        """
        # Validate API key before making requests
        if not self._validate_api_key():
            print(f"ERROR: Invalid or missing API key (length: {len(self.openai_api_key)})")
            return self._create_error_evaluation("Invalid or missing API key")
        
        # Initialize OpenAI client with the provided API key
        try:
            client = OpenAI(
                api_key = self.openai_api_key,
            )
            
            print(f"Sending prompt to {self.model_name} (first 4 chars of API key: {self.openai_api_key[:4]}...)")
            
            messages = []
            messages.append({"role": "user", "content": prompt})

            # Call LLM and invoke prompt
            result = client.chat.completions.create(
                temperature=0.2, 
                max_tokens=max_tokens,
                model=self.model_name,
                messages=messages
            )

            result = result.choices[0].message.content
            
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
            print(f"ERROR evaluating criterion: {e}")
            print(f"API key validity: {'Valid' if self._validate_api_key() else 'Invalid'}")
            
            # Create placeholder evaluation in case of error
            return self._create_error_evaluation(f"Error during evaluation: {str(e)}")
    
    def _validate_api_key(self) -> bool:
        """
        Validate that the API key is properly formatted.
        
        Returns:
            Boolean indicating whether the API key appears valid
        """
        # Basic validation - should be a non-empty string of sufficient length
        return (
            isinstance(self.openai_api_key, str) and 
            len(self.openai_api_key) > 20  # OpenAI API keys are typically longer than this
        )
    
    def _create_error_evaluation(self, error_message: str) -> Dict[str, Any]:
        """
        Create a standard error evaluation object.
        
        Args:
            error_message: Description of the error
            
        Returns:
            Dictionary with standard error fields
        """
        return {
            "document_a_score": 0,
            "document_b_score": 0,
            "document_a_analysis": f"Error: {error_message}",
            "document_b_analysis": f"Error: {error_message}",
            "comparative_analysis": f"Unable to compare due to error: {error_message}",
            "reasoning": f"Error occurred: {error_message}",
            "winner": "N/A"
        }
    
    def _validate_criterion_evaluation(self, criterion_eval: Dict[str, Any]) -> None:
        """
        Ensure all required fields are present in the criterion evaluation.
        
        Args:
            criterion_eval: The criterion evaluation dictionary
        """
        required_fields = [
            "document_a_score", 
            "document_b_score", 
            "winner"
        ]
        
        for field in required_fields:
            if field not in criterion_eval:
                if field in ["document_a_score", "document_b_score"]:
                    criterion_eval[field] = 0
                else:
                    criterion_eval[field] = "N/A"
        
        # Ensure scores are numeric
        try:
            criterion_eval["document_a_score"] = float(criterion_eval["document_a_score"])
            criterion_eval["document_b_score"] = float(criterion_eval["document_b_score"])
        except (ValueError, TypeError):
            criterion_eval["document_a_score"] = 0
            criterion_eval["document_b_score"] = 0
