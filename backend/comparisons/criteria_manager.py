
from typing import List, Dict, Any

class CriteriaManager:
    """Manages the criteria for document comparison"""
    
    def __init__(self):
        self.criteria = []
        self.default_criteria = [
            {
                "id": "1",
                "name": "Clarity",
                "description": "How clear and understandable is the document?",
                "weight": 30,
                "scoring_levels": {
                    1: "Poor - Document is unclear and difficult to understand",
                    2: "Fair - Document has significant clarity issues",
                    3: "Good - Document is mostly clear with minor clarity issues",
                    4: "Very Good - Document is clear and easy to understand",
                    5: "Excellent - Document is exceptionally clear and easy to understand"
                }
            },
            {
                "id": "2",
                "name": "Relevance",
                "description": "How relevant is the content to the subject matter?",
                "weight": 30,
                "scoring_levels": {
                    1: "Poor - Content is mostly irrelevant to the subject matter",
                    2: "Fair - Content has limited relevance to the subject matter",
                    3: "Good - Content is mostly relevant with some gaps",
                    4: "Very Good - Content is highly relevant to the subject matter",
                    5: "Excellent - Content is exceptionally relevant and focused"
                }
            },
            {
                "id": "3",
                "name": "Thoroughness",
                "description": "How comprehensive and complete is the document?",
                "weight": 20,
                "scoring_levels": {
                    1: "Poor - Document lacks comprehensiveness and is incomplete",
                    2: "Fair - Document covers basic aspects but has significant gaps",
                    3: "Good - Document is mostly comprehensive with minor gaps",
                    4: "Very Good - Document is comprehensive and covers all key areas",
                    5: "Excellent - Document is exceptionally thorough and comprehensive"
                }
            },
            {
                "id": "4", 
                "name": "Structure",
                "description": "How well-organized is the document?",
                "weight": 20,
                "scoring_levels": {
                    1: "Poor - Document is poorly organized and structured",
                    2: "Fair - Document has basic structure but with significant issues",
                    3: "Good - Document is reasonably well-organized with minor issues",
                    4: "Very Good - Document is well-organized and structured",
                    5: "Excellent - Document has exceptional organization and structure"
                }
            }
        ]
    
    def gather_criteria_from_user(self) -> List[Dict[str, Any]]:
        """
        Gather criteria from user input.
        
        For web application contexts, this will return the default or cached criteria.
        For CLI contexts, this will interactively prompt the user for criteria.
        
        Returns:
            List of criteria dictionaries with name, description, and weight
        """
        # In non-interactive contexts (web app), return the existing criteria or defaults
        if not self.criteria:
            # If no criteria set yet, use default criteria
            self.criteria = self.default_criteria
            print("Using default criteria for document comparison.")
        
        return self.criteria
    
    def gather_criteria_interactively(self) -> List[Dict[str, Any]]:
        """Gather evaluation criteria directly from user input through the console."""
        print("\n=== Criteria Setup ===")
        print("Please provide information about your evaluation criteria.")
        
        criteria_list = []
        criterion_id = 1
        
        while True:
            print(f"\nCriterion #{criterion_id}")
            
            # Get criterion name
            name = input("What is the criteria name? ")
            
            # Get description
            description = input("What is the criteria description? ")
            
            # Get weightage
            weight = 0
            while True:
                weight_input = input("What is the criteria weightage (%)? ")
                try:
                    weight = float(weight_input.replace('%', ''))
                    break
                except ValueError:
                    print("Please enter a valid number for weightage.")
            
            # Ask if user wants to define scoring levels
            scoring_levels = {}
            define_scoring = input("\nWould you like to define custom scoring levels for this criterion? (yes/no): ").lower()
            
            if define_scoring == 'yes' or define_scoring == 'y':
                print("\nDefine scoring levels (1-5):")
                for level in range(1, 6):
                    default_descriptions = {
                        1: 'Poor - Does not meet the criterion requirements',
                        2: 'Fair - Partially meets some requirements with significant gaps',
                        3: 'Good - Meets most requirements with minor gaps',
                        4: 'Very Good - Fully meets all requirements',
                        5: 'Excellent - Exceeds requirements in meaningful ways'
                    }
                    
                    print(f"Level {level} default: {default_descriptions[level]}")
                    level_description = input(f"Custom description for level {level} (press Enter to use default): ")
                    
                    if not level_description:
                        level_description = default_descriptions[level]
                    
                    scoring_levels[level] = level_description
            else:
                # Set default scoring levels
                scoring_levels = {
                    1: 'Poor - Does not meet the criterion requirements',
                    2: 'Fair - Partially meets some requirements with significant gaps',
                    3: 'Good - Meets most requirements with minor gaps',
                    4: 'Very Good - Fully meets all requirements',
                    5: 'Excellent - Exceeds requirements in meaningful ways'
                }
            
            # Create the criterion
            criterion = {
                "id": str(criterion_id),
                "name": name,
                "description": description,
                "weight": weight,
                "scoring_levels": scoring_levels
            }
            
            criteria_list.append(criterion)
            
            # Check if user wants to add more criteria
            more = input("\nDo you have any more criteria? (yes/no): ").lower()
            valid_inputs = ['yes', 'y', 'no', 'n']
            # Prompt users to key valid inputs only, if they key it in wrongly
            while more not in valid_inputs:
                more = input("\nPlease choose yes or no. Do you have any more criteria? (yes/no): ").lower()
            
            # If the user selects that there are no more criterias
            if more != 'yes' and more != 'y':
                break

            criterion_id += 1
        
        # Normalize weightages if they don't sum to 100
        total_weight = sum(criterion['weight'] for criterion in criteria_list)
        if total_weight != 100 and total_weight > 0:
            print(f"\nNote: Your criteria weightages sum to {total_weight}%, not 100%.")
            normalize = input("Would you like to normalize the weightages to sum to 100%? (yes/no): ").lower()
            if normalize == 'yes' or normalize == 'y':
                for criterion in criteria_list:
                    criterion['weight'] = (criterion['weight'] / total_weight) * 100
                print("Weightages normalized to sum to 100%.")
        
        self.criteria = criteria_list
        print(f"\nLoaded {len(self.criteria)} criteria.")
        
        # Show summary
        print("\n=== Criteria Summary ===")
        for criterion in self.criteria:
            print(f"{criterion['id']}. {criterion['name']} ({criterion['weight']}%)")
            print(f"   Rubric levels: 1-5 defined")
        
        return self.criteria
    
    def add_criterion(self, name: str, description: str, weight: int, scoring_levels: Dict[int, str] = None) -> None:
        """
        Add a criterion to the criteria list.
        
        Args:
            name: Name of the criterion
            description: Description of the criterion
            weight: Weight of the criterion as a percentage
            scoring_levels: Optional custom scoring levels
        """
        criterion_id = str(len(self.criteria) + 1)
        
        # Use default scoring levels if none provided
        if scoring_levels is None:
            scoring_levels = {
                1: 'Poor - Does not meet the criterion requirements',
                2: 'Fair - Partially meets some requirements with significant gaps',
                3: 'Good - Meets most requirements with minor gaps',
                4: 'Very Good - Fully meets all requirements',
                5: 'Excellent - Exceeds requirements in meaningful ways'
            }
            
        self.criteria.append({
            "id": criterion_id,
            "name": name,
            "description": description,
            "weight": weight,
            "scoring_levels": scoring_levels
        })
    
    def get_criterion_by_id(self, criterion_id: str) -> Dict[str, Any]:
        """
        Get a criterion by its ID.
        
        Args:
            criterion_id: ID of the criterion to retrieve
            
        Returns:
            Criterion dictionary if found, empty dict otherwise
        """
        for criterion in self.criteria:
            if criterion["id"] == criterion_id:
                return criterion
        return {}
    
    def get_criterion_by_name(self, name: str) -> Dict[str, Any]:
        """
        Get a criterion by its name.
        
        Args:
            name: Name of the criterion to retrieve
            
        Returns:
            Criterion dictionary if found, empty dict otherwise
        """
        for criterion in self.criteria:
            if criterion["name"].lower() == name.lower():
                return criterion
        return {}
