
import os
import fitz  # PyMuPDF
import re
import base64
from typing import Dict

class PDFProcessor:
    """
    Handles loading PDFs, extracting text, and identifying sections
    relevant to specific criteria.
    """
    
    def __init__(self, pdf_folder: str):
        """
        Initialize the processor with a folder path.
        
        Args:
            pdf_folder: Directory containing PDFs
        """
        self.pdf_folder = pdf_folder
        self.pdf_contents = {}
        self.extracted_criteria = {}
        self.criteria_sections = {}  # Initialize the criteria_sections attribute
    
    def load_pdfs(self) -> Dict[str, str]:
        """
        Load all PDF files from the folder and extract text content
        
        Returns:
            Dictionary mapping PDF filenames to text content
        """
        print(f"\nLoading PDFs from {self.pdf_folder}...")
        
        if not os.path.exists(self.pdf_folder):
            print(f"Error: PDF folder does not exist: {self.pdf_folder}")
            return {}
            
        files = [f for f in os.listdir(self.pdf_folder) if f.lower().endswith('.pdf')]
        
        if not files:
            print("No PDF files found in the folder.")
            return {}
        
        for filename in files:
            file_path = os.path.join(self.pdf_folder, filename)
            try:
                # Use PyMuPDF to extract text from PDF
                pdf_document = fitz.open(file_path)
                text = ""
                for page_num in range(len(pdf_document)):
                    page = pdf_document.load_page(page_num)
                    text += page.get_text()
                
                self.pdf_contents[filename] = text
                print(f"Loaded: {filename} ({len(text)} characters)")
                
            except Exception as e:
                print(f"Error loading {filename}: {str(e)}")
        
        return self.pdf_contents
    
    def load_base64_pdf(self, filename: str, base64_content: str) -> str:
        """
        Load a PDF from base64 encoded content and extract text
        
        Args:
            filename: Name to use for the PDF
            base64_content: Base64 encoded PDF content
            
        Returns:
            Extracted text content from the PDF
        """
        try:
            # Remove data URL prefix if present
            if ',' in base64_content:
                base64_content = base64_content.split(',', 1)[1]
                
            # Decode base64 content
            pdf_bytes = base64.b64decode(base64_content)
            
            # Save temporarily to disk to use PyMuPDF
            temp_file_path = os.path.join(self.pdf_folder, filename)
            with open(temp_file_path, 'wb') as f:
                f.write(pdf_bytes)
            
            # Use PyMuPDF to extract text
            pdf_document = fitz.open(temp_file_path)
            text = ""
            for page_num in range(len(pdf_document)):
                page = pdf_document.load_page(page_num)
                text += page.get_text()
            
            pdf_document.close()
            
            # Store the extracted text
            self.pdf_contents[filename] = text
            print(f"Loaded base64 PDF: {filename} ({len(text)} characters)")
            
            return text
            
        except Exception as e:
            print(f"Error loading base64 PDF {filename}: {str(e)}")
            return ""
    
    def extract_criteria_sections(self) -> Dict[str, Dict[str, str]]:
        """
        Extract sections of each PDF that are likely relevant to different criteria
        based on keyword identification.
        
        Returns:
            Dictionary mapping PDF files to criteria sections
        """
        if not self.pdf_contents:
            print("No PDF contents loaded. Call load_pdfs() first.")
            return {}
        
        # Initialize criteria sections
        self.criteria_sections = {pdf: {} for pdf in self.pdf_contents}
        
        # Common keywords that might indicate sections relevant to specific criteria
        keyword_patterns = {
            "methodology": r"(methodology|method|approach|procedure|technique|strategy|protocol)",
            "results": r"(results|findings|outcomes|observations|data analysis|analysis|discovered)",
            "conclusions": r"(conclusion|summary|key finding|significance|interpretation)",
            "clarity": r"(clear|concise|readable|understandable|comprehensible)",
            "innovation": r"(innovation|novel|groundbreaking|unique|original|advancement|cutting-edge)",
            "literature_review": r"(literature|previous studies|prior research|existing work|references|cited)"
        }
        
        for pdf, content in self.pdf_contents.items():
            # Find potential sections for each criterion
            for criterion, pattern in keyword_patterns.items():
                # Look for paragraphs containing criterion keywords
                criterion_regex = re.compile(pattern, re.IGNORECASE)
                
                # Find all matches and surrounding context
                matches = list(criterion_regex.finditer(content))
                
                if matches:
                    # Extract text around matches to capture relevant sections
                    context_sections = []
                    for match in matches:
                        # Get ~1000 characters of context around the match
                        start = max(0, match.start() - 500)
                        end = min(len(content), match.end() + 500)
                        
                        # Try to extend to paragraph boundaries
                        context_start = content.rfind("\n\n", 0, start)
                        context_end = content.find("\n\n", end)
                        
                        if context_start != -1:
                            start = context_start
                        if context_end != -1:
                            end = context_end
                            
                        context_sections.append(content[start:end])
                    
                    # Combine sections, avoiding duplicates
                    self.criteria_sections[pdf][criterion] = "\n\n...\n\n".join(context_sections)
        
        return self.criteria_sections
    
    def _extract_criteria_from_text(self, text: str) -> Dict[str, str]:
        """
        Extract criteria sections from text using regex patterns.
        
        Args:
            text: The full document text
            
        Returns:
            Dict mapping criterion names to their content
        """
        criteria = {}
        
        # Define the patterns for criteria sections
        criteria_pattern = r"Criterion\s+(\d+)\s*:\s*([A-Za-z\-\s]+?)\s*\((\d+)%\)(.*?)(?=Criterion\s+\d+\s*:|$)"
        
        # Find all matches in the text
        matches = re.finditer(criteria_pattern, text, re.DOTALL)
        
        for match in matches:
            criterion_number = match.group(1)
            criterion_name = match.group(2)
            criterion_weight = match.group(3)
            criterion_content = match.group(4).strip()
            
            # Create a consistent key for the criterion
            criterion_key = f"Criterion {criterion_number}: {criterion_name}"
            
            # Store the criterion content
            criteria[criterion_key] = criterion_content
        
        # If no criteria found with the pattern, try a simpler approach
        if not criteria:
            # Look for sections with "Criterion X" format
            # Note that documents without this format may not work 
            simple_pattern = r"(Criterion\s+\d+:.*?)(?=Criterion\s+\d+:|$)"
            matches = re.finditer(simple_pattern, text, re.DOTALL)
            
            for match in matches:
                full_section = match.group(1).strip()
                # Extract the criterion header (first line)
                lines = full_section.split('\n')
                header = lines[0].strip()
                content = '\n'.join(lines[1:]).strip()
                
                criteria[header] = content
        
        return criteria
    
    def get_criteria_content(self, document_name: str, criterion_name: str) -> str:
        """
        Get extracted content for a specific document and criterion
        
        Args:
            document_name: Name of the PDF document
            criterion: Name of the criterion
            
        Returns:
            Extracted text relevant to the criterion
        """
        """
        Get content for a specific criterion from a PDF.
        
        Args:
            document_name: The name of the PDF file
            criterion_name: The name or number of the criterion (e.g., "Risk-taking" or "Criterion 1")
            
        Returns:
            The content of the specified criterion section
        """
        # Extract criteria if not already done
        if document_name not in self.extracted_criteria:
            if document_name in self.pdf_contents:
                self.extracted_criteria[document_name] = self._extract_criteria_from_text(self.pdf_contents[document_name])
            else:
                return ""
        
        criteria_sections = self.extracted_criteria[document_name]
        
        # Try to find an exact match first
        for key, content in criteria_sections.items():
            if criterion_name in key:
                return content
        
        # If no exact match, try a fuzzy match
        criterion_lower = criterion_name.lower()
        for key, content in criteria_sections.items():
            key_lower = key.lower()
            
            # Match by criterion number
            if ("criterion " + criterion_name.split(':')[0].strip()) in key_lower:
                return content
                
            # Match by criterion name
            if criterion_lower in key_lower:
                return content
        
        # No match found
        return self.criteria_sections.get(document_name, {}).get(criterion_name, "")
