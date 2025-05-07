
class ComparisonDataProcessor:
    """Processes comparison result data for reporting"""
    
    @staticmethod
    def extract_document_scores(pdf_list, comparison_results):
        """
        Extract document scores from comparison results
        
        Args:
            pdf_list: List of PDF document names
            comparison_results: Results from comparisons
            
        Returns:
            Dictionary containing document scores
        """
        # Initialize scores dictionary
        doc_scores = {doc: {'total_score': 0, 'count': 0, 'criteria_scores': {}} for doc in pdf_list}
        
        # Process each comparison result
        for comp in comparison_results:
            doc_a = comp.get("document_a", "")
            doc_b = comp.get("document_b", "")
            
            if not doc_a or not doc_b:
                continue
                
            # Extract evaluation details if available
            eval_details = comp.get("evaluation_details", {})
            
            # Extract overall scores if available
            overall_scores = eval_details.get("overall_scores", {})
            doc_a_score = overall_scores.get("document_a", 0)
            doc_b_score = overall_scores.get("document_b", 0)
            
            # Track document scores
            if doc_a_score > 0:
                doc_scores[doc_a]['total_score'] += doc_a_score
                doc_scores[doc_a]['count'] += 1
            
            if doc_b_score > 0:
                doc_scores[doc_b]['total_score'] += doc_b_score
                doc_scores[doc_b]['count'] += 1
            
            # Extract individual criterion evaluations
            criterion_evaluations = eval_details.get("criterion_evaluations", [])
            
            if criterion_evaluations:
                ComparisonDataProcessor._process_criterion_scores(
                    criterion_evaluations, doc_a, doc_b, doc_scores
                )
                
        return doc_scores
    
    @staticmethod
    def _process_criterion_scores(criterion_evaluations, doc_a, doc_b, doc_scores):
        """Process scores for individual criteria"""
        for eval_item in criterion_evaluations:
            criterion_name = eval_item.get("criterion_name", "")
            doc_a_score = eval_item.get("document_a_score", 0)
            doc_b_score = eval_item.get("document_b_score", 0)
            
            # Track criterion-specific scores
            if criterion_name:
                if criterion_name not in doc_scores[doc_a]['criteria_scores']:
                    doc_scores[doc_a]['criteria_scores'][criterion_name] = {'total': 0, 'count': 0}
                if criterion_name not in doc_scores[doc_b]['criteria_scores']:
                    doc_scores[doc_b]['criteria_scores'][criterion_name] = {'total': 0, 'count': 0}
                    
                doc_scores[doc_a]['criteria_scores'][criterion_name]['total'] += doc_a_score
                doc_scores[doc_a]['criteria_scores'][criterion_name]['count'] += 1
                doc_scores[doc_b]['criteria_scores'][criterion_name]['total'] += doc_b_score
                doc_scores[doc_b]['criteria_scores'][criterion_name]['count'] += 1
    
    @staticmethod
    def calculate_win_counts(pdf_list, comparison_results):
        """
        Calculate win counts for each document
        
        Args:
            pdf_list: List of PDF document names
            comparison_results: Results from comparisons
            
        Returns:
            Dictionary mapping document names to win counts
        """
        win_counts = {}
        for doc in pdf_list:
            win_counts[doc] = sum(1 for comp in comparison_results if comp.get("winner") == doc)
        return win_counts
    
    @staticmethod
    def prepare_report_data(pdf_list, comparison_results):
        """
        Prepare data for the main comparison report
        
        Args:
            pdf_list: List of PDF document names
            comparison_results: Results from comparisons
            
        Returns:
            List of dictionaries containing report data
        """
        report_data = []
        
        for comp in comparison_results:
            doc_a = comp.get("document_a", "")
            doc_b = comp.get("document_b", "")
            winner = comp.get("winner", "N/A")
            
            try:
                eval_details = comp.get("evaluation_details", {})
                explanation = eval_details.get("explanation", "No explanation provided")
                
                # Extract overall scores if available
                overall_scores = eval_details.get("overall_scores", {})
                doc_a_score = overall_scores.get("document_a", 0)
                doc_b_score = overall_scores.get("document_b", 0)
                
                # Create main report entry
                report_entry = {
                    "Comparison": f"{doc_a} vs {doc_b}",
                    f"{doc_a} Score": doc_a_score,
                    f"{doc_b} Score": doc_b_score,
                    "Winner": winner,
                    "Overall Explanation": explanation
                }
                report_data.append(report_entry)
                
            except Exception as e:
                # Simplified record if detailed evaluation not available
                report_data.append({
                    "Comparison": f"{doc_a} vs {doc_b}",
                    "Winner": winner,
                    "Error": str(e)
                })
                
        return report_data
    
    @staticmethod
    def prepare_criterion_data(comparison_results):
        """
        Prepare detailed criterion data for reporting
        
        Args:
            comparison_results: Results from comparisons
            
        Returns:
            List of dictionaries containing criterion data
        """
        criterion_data = []
        
        for comp in comparison_results:
            doc_a = comp.get("document_a", "")
            doc_b = comp.get("document_b", "")
            
            try:
                eval_details = comp.get("evaluation_details", {})
                criterion_evaluations = eval_details.get("criterion_evaluations", [])
                
                if criterion_evaluations:
                    for eval_item in criterion_evaluations:
                        criterion_id = eval_item.get("criterion_id", "")
                        criterion_name = eval_item.get("criterion_name", "")
                        criterion_winner = eval_item.get("winner", "")
                        doc_a_score = eval_item.get("document_a_score", 0)
                        doc_b_score = eval_item.get("document_b_score", 0)
                        
                        # Get the reasoning if available
                        reasoning = eval_item.get("reasoning", "No detailed reasoning provided")
                        
                        # Create detailed criterion entry
                        criterion_entry = {
                            "Comparison": f"{doc_a} vs {doc_b}",
                            "Criterion ID": criterion_id,
                            "Criterion Name": criterion_name,
                            "Document A Score": doc_a_score,
                            "Document A Analysis": eval_item.get("document_a_analysis", "No analysis provided"),
                            "Document B Score": doc_b_score,
                            "Document B Analysis": eval_item.get("document_b_analysis", "No analysis provided"),
                            "Comparative Analysis": eval_item.get("comparative_analysis", "No comparative analysis provided"),
                            "Detailed Reasoning": reasoning,
                            "Winner": doc_a if criterion_winner == "A" else doc_b if criterion_winner == "B" else "Tie"
                        }
                        criterion_data.append(criterion_entry)
            except Exception:
                pass
                
        return criterion_data
    
    @staticmethod
    def prepare_criterion_summary(pdf_list, comparison_results):
        """
        Prepare summary of criterion-specific scores
        
        Args:
            pdf_list: List of PDF document names
            comparison_results: Results from comparisons
            
        Returns:
            List of dictionaries containing criterion summary data
        """
        criterion_summary = []
        all_criteria = set()
        
        # Find all unique criteria
        for comp in comparison_results:
            eval_details = comp.get("evaluation_details", {})
            criterion_evaluations = eval_details.get("criterion_evaluations", [])
            for eval_item in criterion_evaluations:
                criterion_name = eval_item.get("criterion_name", "")
                if criterion_name:
                    all_criteria.add(criterion_name)
        
        # Get win counts
        win_counts = ComparisonDataProcessor.calculate_win_counts(pdf_list, comparison_results)
        
        # Create summary entries for each document
        for doc in pdf_list:
            doc_criterion_scores = {}
            # For each criterion, find all scores for this document
            for criterion in all_criteria:
                scores = []
                for comp in comparison_results:
                    eval_details = comp.get("evaluation_details", {})
                    criterion_evaluations = eval_details.get("criterion_evaluations", [])
                    for eval_item in criterion_evaluations:
                        if eval_item.get("criterion_name", "") == criterion:
                            if comp["document_a"] == doc:
                                score = eval_item.get("document_a_score", 0)
                                if score > 0:
                                    scores.append(score)
                            elif comp["document_b"] == doc:
                                score = eval_item.get("document_b_score", 0)
                                if score > 0:
                                    scores.append(score)
                
                # Calculate average for this criterion if scores exist
                if scores:
                    doc_criterion_scores[criterion] = sum(scores) / len(scores)
                else:
                    doc_criterion_scores[criterion] = 0
            
            # Create entry with document and all its criterion scores
            entry = {'Document': doc, 'Win Count': win_counts.get(doc, 0)}
            for criterion in all_criteria:
                entry[f"{criterion} Score"] = round(doc_criterion_scores.get(criterion, 0), 2)
            
            criterion_summary.append(entry)
            
        return criterion_summary
