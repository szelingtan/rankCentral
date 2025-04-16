from typing import Dict, List, Any, Tuple
import json
import tiktoken
from langchain_openai import OpenAI
from .criterion_evaluator import CriterionEvaluator
from .prompt_generator import PromptGenerator

class DocumentComparator:
    """Handles the comparison between two documents across multiple criteria"""
    
    def __init__(self, documents: Dict[str, str], criteria: List[Dict[str, Any]], openai_api_key: str, pdf_processor=None, use_custom_prompt=False, model_name="gpt-4.1-mini"):
        """
        Initialize the document comparator.
        
        Args:
            documents: Dictionary mapping document names to their text content
            criteria: List of criteria dictionaries with name, description, and weightage
            openai_api_key: API key for OpenAI
            pdf_processor: Optional PDFProcessor instance for section extraction
            use_custom_prompt: Whether to use a custom prompt for evaluation
            model_name: The specific OpenAI model to use
        """
        self.documents = documents
        self.criteria = criteria
        self.openai_api_key = openai_api_key
        self.pdf_processor = pdf_processor
        self.use_custom_prompt = use_custom_prompt
        self.model_name = model_name
        self.tokenizer = tiktoken.encoding_for_model("gpt-4")  # Use gpt-4 encoding for token counting
        self.criterion_evaluator = CriterionEvaluator(openai_api_key, model_name)
        self.prompt_generator = PromptGenerator()
    
    def compare(self, doc1_name: str, doc2_name: str) -> Dict[str, Any]:
        """
        Compare two documents by evaluating each criterion separately.
        
        Args:
            doc1_name: Name of the first document
            doc2_name: Name of the second document
            
        Returns:
            Dictionary with comparison results
        """
        # Initialize storage for evaluation results
        all_criterion_evaluations = []
        doc_a_weighted_score = 0
        doc_b_weighted_score = 0
        
        # Process each criterion individually
        for criterion in self.criteria:
            print(f"Processing criterion: {criterion}")
            criterion_name = criterion['name']
            criterion_weight = criterion['weight']
            criterion_id = criterion.get('id', '')
            
            print(f"  Evaluating criterion: {criterion_name}")
            
            # Get full document content for this criterion
            doc1_content, doc2_content = self._get_criterion_sections(doc1_name, doc2_name, criterion)
            
            # Generate a prompt for this criterion
            if self.use_custom_prompt or criterion.get('is_custom_prompt', False):
                # Use the custom prompt approach
                prompt = self.prompt_generator.generate_custom_prompt(
                    doc1_name,
                    doc2_name,
                    doc1_content,
                    doc2_content,
                    criterion['description']  # The custom prompt is in the description field
                )
            else:
                # Use the criteria-based approach
                prompt = self.prompt_generator.generate_criterion_prompt(
                    doc1_name,
                    doc2_name,
                    doc1_content,
                    doc2_content,
                    criterion
                )
            
            # Calculate max tokens for the LLM response
            prompt_tokens = len(self.tokenizer.encode(prompt))
            max_tokens = max(1000, min(4096 - prompt_tokens - 50, 1500))
            
            # Evaluate this criterion
            criterion_eval = self.criterion_evaluator.evaluate(prompt, max_tokens)
            
            # Add criterion ID and name if not present
            if 'criterion_id' not in criterion_eval:
                criterion_eval['criterion_id'] = criterion_id
            
            if 'criterion_name' not in criterion_eval:
                criterion_eval['criterion_name'] = criterion_name
            
            # Calculate weighted scores for this criterion
            doc_a_score = criterion_eval.get('document_a_score', 0)
            doc_b_score = criterion_eval.get('document_b_score', 0)
            
            # Update running totals
            weighted_a = (doc_a_score / 5) * criterion_weight  # Assuming 5 is max score
            weighted_b = (doc_b_score / 5) * criterion_weight
            
            doc_a_weighted_score += weighted_a
            doc_b_weighted_score += weighted_b
            
            # Store this criterion's evaluation
            all_criterion_evaluations.append(criterion_eval)
            
            # Log progress
            winner = criterion_eval.get('winner', 'Tie')
            print(f"    Scores - A: {doc_a_score}, B: {doc_b_score}, Winner: {winner}")
        
        # Determine overall winner based on accumulated weighted scores
        overall_winner, winner_name, explanation = self._determine_winner(
            doc1_name, 
            doc2_name, 
            doc_a_weighted_score, 
            doc_b_weighted_score,
            all_criterion_evaluations
        )
        
        # Create the full evaluation
        evaluation = {
            "criterion_evaluations": all_criterion_evaluations,
            "overall_scores": {
                "document_a": doc_a_weighted_score,
                "document_b": doc_b_weighted_score
            },
            "overall_winner": overall_winner,
            "explanation": explanation
        }
        
        # Prepare the comparison result
        comparison_result = {
            "document_a": doc1_name,
            "document_b": doc2_name,
            "winner": winner_name if overall_winner != "Tie" else "Tie",
            "error": "N/A",
            "evaluation_details": evaluation,
            "criterion_scores": {criterion['name']: {
                'document_a': next((ce.get('document_a_score', 0) for ce in all_criterion_evaluations 
                               if ce.get('criterion_name') == criterion['name']), 0),
                'document_b': next((ce.get('document_b_score', 0) for ce in all_criterion_evaluations 
                               if ce.get('criterion_name') == criterion['name']), 0)
            } for criterion in self.criteria}
        }
        
        print(f"Comparison complete: Winner is {winner_name}")
        return comparison_result
    
    def _get_criterion_sections(self, doc1_name: str, doc2_name: str, criterion: Dict) -> Tuple[str, str]:
        """
        Get the full document content for both documents.
        
        Args:
            doc1_name: Name of first document
            doc2_name: Name of second document
            criterion: The criterion dictionary (not used for section extraction anymore)
            
        Returns:
            Tuple of full document content from both documents
        """
        # Make sure we have the document contents
        if doc1_name not in self.documents or doc2_name not in self.documents:
            print(f"Warning: Document not found in document dictionary. Doc1: {doc1_name in self.documents}, Doc2: {doc2_name in self.documents}")
            return "", ""
            
        # Get full document content
        doc1_content = self.documents[doc1_name]
        doc2_content = self.documents[doc2_name]
        
        # Log a preview of the document content
        print(f"Document content preview for {doc1_name}: {doc1_content[:100]}...")
        print(f"Document content preview for {doc2_name}: {doc2_content[:100]}...")
        
        return doc1_content, doc2_content
    
    def _determine_winner(self, doc1_name: str, doc2_name: str, 
                         doc_a_weighted_score: float, doc_b_weighted_score: float,
                         criterion_evaluations: List[Dict]) -> Tuple[str, str, str]:
        """
        Determine the overall winner and generate an explanation.
        
        Args:
            doc1_name: Name of the first document
            doc2_name: Name of the second document
            doc_a_weighted_score: Weighted score of the first document
            doc_b_weighted_score: Weighted score of the second document
            criterion_evaluations: List of criterion evaluation results
            
        Returns:
            Tuple of (overall_winner, winner_name, explanation)
        """
        # Determine overall winner based on accumulated weighted scores
        overall_winner = "A" if doc_a_weighted_score > doc_b_weighted_score else "B"
        if doc_a_weighted_score == doc_b_weighted_score:
            overall_winner = "Tie"
            
        winner_name = doc1_name if overall_winner == "A" else doc2_name
        if overall_winner == "Tie":
            winner_name = "Tie between documents"
        
        # Generate an overall explanation
        if overall_winner != "Tie":
            explanation = f"Document {overall_winner} ({winner_name}) is the overall winner with a weighted score of "
            explanation += f"{doc_a_weighted_score:.2f} vs {doc_b_weighted_score:.2f}. "
        else:
            explanation = f"Documents are tied with equal weighted scores of {doc_a_weighted_score:.2f}. "
            
        # Add summary of criterion-specific performance
        winning_criteria = []
        for eval_item in criterion_evaluations:
            criterion = eval_item.get('criterion_name', '')
            winner = eval_item.get('winner', '')
            if winner == overall_winner and winner != "Tie" and winner != "N/A":
                winning_criteria.append(criterion)
        
        if winning_criteria:
            explanation += f"Document {overall_winner} performed better in: {', '.join(winning_criteria)}. "
            
        explanation += "This assessment is based on both independent scoring against the rubrics and direct comparison between the documents."
        
        return overall_winner, winner_name, explanation
