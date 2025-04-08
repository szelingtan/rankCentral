from typing import Dict, List, Any
import json
from .document_comparator import DocumentComparator
from .mergesort_ranking import MergesortRanker

class ComparisonEngine:
    def __init__(self, documents: Dict[str, str], comparison_criteria: List[Dict[str, Any]], openai_api_key: str, pdf_processor=None):
        """
        Initialize the document comparison engine.
        
        Args:
            documents: Dictionary mapping document names to their text content
            comparison_criteria: List of criteria dictionaries with name, description, and weightage
            openai_api_key: API key for OpenAI
            pdf_processor: Optional PDFProcessor instance for section extraction
        """
        self.documents = documents
        self.criteria = comparison_criteria
        self.openai_api_key = openai_api_key
        self.pdf_processor = pdf_processor
        self.comparison_results = []
        self.document_scores = {}  # Store individual document scores
        
        # Initialize the document comparator
        self.document_comparator = DocumentComparator(
            documents, 
            comparison_criteria, 
            openai_api_key, 
            pdf_processor
        )
    
    def compare_documents(self, doc1_name: str, doc2_name: str) -> Dict[str, Any]:
        """
        Compare two documents by evaluating each criterion separately.
        
        Args:
            doc1_name: Name of the first document
            doc2_name: Name of the second document
            
        Returns:
            Dictionary with comparison results
        """
        print(f"Comparing: {doc1_name} vs {doc2_name}")
        
        # Delegate to the document comparator
        comparison_result = self.document_comparator.compare(doc1_name, doc2_name)
        
        # Update document scores
        self._update_document_scores(doc1_name, doc2_name, comparison_result)
        
        # Store the comparison result
        self.comparison_results.append(comparison_result)
        
        return comparison_result
    
    def _update_document_scores(self, doc1_name: str, doc2_name: str, comparison_result: Dict[str, Any]) -> None:
        """
        Update the document scores based on the comparison result.
        
        Args:
            doc1_name: Name of the first document
            doc2_name: Name of the second document
            comparison_result: The result of comparing the documents
        """
        # Get the evaluation details
        evaluation = comparison_result.get("evaluation_details", {})
        overall_scores = evaluation.get("overall_scores", {})
        
        # Extract scores
        doc_a_score = overall_scores.get("document_a", 0)
        doc_b_score = overall_scores.get("document_b", 0)
        
        # Initialize document scores if necessary
        if doc1_name not in self.document_scores:
            self.document_scores[doc1_name] = []
        if doc2_name not in self.document_scores:
            self.document_scores[doc2_name] = []
        
        # Store the scores
        self.document_scores[doc1_name].append(doc_a_score)
        self.document_scores[doc2_name].append(doc_b_score)
    
    def compare_with_mergesort(self, doc_list: List[str]) -> List[str]:
        """
        Sort documents using merge sort with pairwise comparisons.
        
        Args:
            doc_list: List of document names to compare
            
        Returns:
            Sorted list of document names
        """
        # Use the MergesortRanker to rank documents
        ranker = MergesortRanker(self)
        return ranker.rank_documents(doc_list)
