
from typing import List, Dict, Any

class MergesortRanker:
    """Implements the mergesort algorithm for ranking documents"""
    
    def __init__(self, comparison_engine):
        """
        Initialize the mergesort ranker.
        
        Args:
            comparison_engine: The comparison engine to use for comparing documents
        """
        self.comparison_engine = comparison_engine
    
    def rank_documents(self, doc_list: List[str]) -> List[str]:
        """
        Rank documents using mergesort with pairwise comparisons.
        
        Args:
            doc_list: List of document names to compare
            
        Returns:
            Sorted list of document names
        """
        if len(doc_list) <= 1:
            return doc_list
        
        # Split the list in half
        mid = len(doc_list) // 2
        left_half = self.rank_documents(doc_list[:mid])
        right_half = self.rank_documents(doc_list[mid:])
        
        # Merge the two halves
        return self.merge(left_half, right_half)
    
    def merge(self, left: List[str], right: List[str]) -> List[str]:
        """
        Merge two sorted lists by comparing documents.
        
        Args:
            left: First sorted list of document names
            right: Second sorted list of document names
            
        Returns:
            Merged sorted list of document names
        """
        result = []
        i = j = 0
    
        while i < len(left) and j < len(right):
            # Compare the current documents from each list
            comparison = self.comparison_engine.compare_documents(left[i], right[j])
            winner = comparison["winner"]
            
            # Handle tie case
            if winner == "Tie":
                # In case of a tie, choose arbitrarily but consistently
                result.append(left[i])
                i += 1
            elif winner == left[i]:
                result.append(left[i])
                i += 1
            else:
                result.append(right[j])
                j += 1
        
        # Add any remaining documents
        result.extend(left[i:])
        result.extend(right[j:])
        
        return result
