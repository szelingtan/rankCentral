from typing import Dict, List, Any, Tuple
import json
import os
import time
from .document_comparator import DocumentComparator
from .mergesort_ranking import mergesort_with_comparator

class ComparisonEngine:
    """Main engine for comparing multiple documents"""
    
    def __init__(self, documents: Dict[str, str], criteria: List[Dict[str, Any]], 
                openai_api_key: str, pdf_processor=None, use_custom_prompt=False,
                model_name="gpt-4.1-mini"):
        """
        Initialize the comparison engine.
        
        Args:
            documents: Dictionary mapping document names to their content
            criteria: List of criteria dictionaries with name, description, and weightage
            openai_api_key: API key for OpenAI
            pdf_processor: Optional PDFProcessor instance for section extraction
            use_custom_prompt: Whether to use a custom prompt for evaluation
            model_name: The model to use for evaluation
        """
        self.documents = documents
        self.criteria = criteria
        self.openai_api_key = openai_api_key
        self.pdf_processor = pdf_processor
        self.use_custom_prompt = use_custom_prompt
        self.comparison_results = []  # Store all pairwise comparison results
        self.model_name = model_name
        
        # Initialize document comparator for actual comparisons
        self.document_comparator = DocumentComparator(
            documents, criteria, openai_api_key, pdf_processor, use_custom_prompt, model_name
        )
    
    def compare_documents(self, doc1: str, doc2: str) -> Dict[str, Any]:
        """
        Compare two documents using the document comparator.
        
        Args:
            doc1: Name of the first document
            doc2: Name of the second document
            
        Returns:
            Dictionary containing the comparison results
        """
        print(f"\nComparing {doc1} vs {doc2}...")
        
        try:
            # Check if this pair has already been compared (or the reverse)
            existing_result = self._find_existing_comparison(doc1, doc2)
            if existing_result:
                print(f"Using cached comparison for {doc1} vs {doc2}")
                return existing_result
            
            # Perform the actual comparison
            result = self.document_comparator.compare(doc1, doc2)
            self.comparison_results.append(result)
            return result
        except Exception as e:
            error_msg = f"Error comparing {doc1} vs {doc2}: {str(e)}"
            print(error_msg)
            
            # Return an error result
            error_result = {
                "document_a": doc1,
                "document_b": doc2,
                "winner": None,
                "error": error_msg
            }
            self.comparison_results.append(error_result)
            return error_result
    
    def _find_existing_comparison(self, doc1: str, doc2: str) -> Dict[str, Any]:
        """
        Check if a comparison between these documents already exists.
        
        Args:
            doc1: Name of the first document
            doc2: Name of the second document
            
        Returns:
            Existing comparison result or None
        """
        for result in self.comparison_results:
            # Check direct match
            if result["document_a"] == doc1 and result["document_b"] == doc2:
                return result
            
            # Check reverse match (need to invert the result)
            if result["document_a"] == doc2 and result["document_b"] == doc1:
                # Create inverted result
                inverted_result = result.copy()
                inverted_result["document_a"] = doc1
                inverted_result["document_b"] = doc2
                
                # Invert winner
                if result["winner"] == result["document_a"]:
                    inverted_result["winner"] = doc1
                elif result["winner"] == result["document_b"]:
                    inverted_result["winner"] = doc2
                    
                return inverted_result
                
        return None
    
    def compare_with_mergesort(self, documents: List[str]) -> List[str]:
        """
        Rank documents using mergesort with pairwise comparisons.
        
        Args:
            documents: List of document names to compare
            
        Returns:
            Sorted list of documents from best to worst
        """
        start_time = time.time()
        print(f"Starting comparison of {len(documents)} documents using merge sort...")
        
        if len(documents) <= 1:
            return documents
            
        comparator = lambda doc1, doc2: self._comparison_function(doc1, doc2)
        
        sorted_docs = mergesort_with_comparator(documents, comparator)
        
        end_time = time.time()
        duration = end_time - start_time
        print(f"Comparison completed in {duration:.2f} seconds")
        print(f"Final ranking: {sorted_docs}")
        
        return sorted_docs
    
    def _comparison_function(self, doc1: str, doc2: str) -> int:
        """
        Comparison function for mergesort.
        
        Args:
            doc1: First document name
            doc2: Second document name
            
        Returns:
            1 if doc1 is better, -1 if doc2 is better, 0 if equal
        """
        if doc1 == doc2:
            return 0
            
        result = self.compare_documents(doc1, doc2)
        
        # If there was an error in comparison
        if result.get("error", "N/A") != "N/A":
            print(f"Error in comparison: {result.get('error')}")
            return 0  # Consider them equal in case of error
        
        if result["winner"] == "Tie" or result["winner"] is None:
            return 0
        elif result["winner"] == doc1:
            return 1
        else:
            return -1
