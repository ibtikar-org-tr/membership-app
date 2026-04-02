// Most popular skills from LinkedIn across all industries
export const POPULAR_SKILLS = [
  // Programming Languages & Tech
  'JavaScript', 'Python', 'Java', 'TypeScript', 'C#', 'C++', 'PHP', 'Ruby', 'Go', 'Rust',
  'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'C', 'Objective-C', 'Dart', 'Perl', 'Shell Scripting',

  // Frontend Technologies
  'React', 'Vue.js', 'Angular', 'HTML', 'CSS', 'Sass', 'Less', 'Bootstrap', 'Tailwind CSS',
  'jQuery', 'Next.js', 'Nuxt.js', 'Gatsby', 'Svelte', 'Webpack', 'Vite', 'Parcel',

  // Backend Technologies
  'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'Ruby on Rails',
  'ASP.NET', 'Symfony', 'Gin', 'Echo', 'Koa.js', 'NestJS', 'GraphQL', 'REST API',

  // Databases
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server', 'MariaDB',
  'Cassandra', 'DynamoDB', 'Firebase', 'Supabase', 'Elasticsearch', 'Neo4j',

  // Cloud & DevOps
  'AWS', 'Azure', 'Google Cloud Platform', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'GitHub',
  'GitLab', 'Bitbucket', 'CI/CD', 'Terraform', 'Ansible', 'Chef', 'Puppet', 'Vagrant',
  'Linux', 'Ubuntu', 'CentOS', 'Nginx', 'Apache', 'CloudFlare',

  // Mobile Development
  'React Native', 'Flutter', 'iOS Development', 'Android Development', 'Xamarin', 'Ionic',
  'Cordova', 'Unity', 'Unreal Engine',

  // Data Science & AI
  'Machine Learning', 'Deep Learning', 'Artificial Intelligence', 'Data Science', 'Data Analysis',
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn',
  'Jupyter', 'Power BI', 'Tableau', 'Apache Spark', 'Hadoop', 'ETL', 'Big Data',

  // Soft Skills
  'Leadership', 'Project Management', 'Team Management', 'Communication', 'Problem Solving',
  'Critical Thinking', 'Time Management', 'Collaboration', 'Adaptability', 'Creativity',
  'Public Speaking', 'Negotiation', 'Strategic Planning', 'Decision Making', 'Mentoring',

  // Methodologies & Frameworks
  'Agile', 'Scrum', 'Kanban', 'Lean', 'DevOps', 'Test Driven Development', 'Domain Driven Design',
  'Microservices', 'Serverless', 'Event Driven Architecture', 'MVC', 'MVP', 'MVVM',

  // Testing
  'Unit Testing', 'Integration Testing', 'End-to-End Testing', 'Jest', 'Mocha', 'Cypress',
  'Selenium', 'Playwright', 'TestNG', 'JUnit', 'PyTest', 'PHPUnit',

  // Business & Management
  'Business Management', 'Strategic Planning', 'Business Development', 'Operations Management',
  'Change Management', 'Process Improvement', 'Business Strategy', 'Organizational Development',
  'Performance Management', 'Stakeholder Management', 'Cross-functional Team Leadership',
  'Budget Management', 'Cost Analysis', 'Risk Management', 'Compliance Management',

  // Finance & Accounting
  'Financial Analysis', 'Financial Modeling', 'Financial Planning', 'Budget Planning',
  'Cost Accounting', 'Management Accounting', 'Tax Planning', 'Auditing', 'Investment Analysis',
  'Corporate Finance', 'Treasury Management', 'Risk Assessment', 'Portfolio Management',
  'Forecasting', 'Variance Analysis', 'Cash Flow Management', 'Credit Analysis',

  // Sales & Marketing
  'Sales', 'Digital Marketing', 'Social Media Marketing', 'Content Marketing', 'Email Marketing',
  'SEO', 'SEM', 'PPC', 'Marketing Strategy', 'Brand Management', 'Market Research',
  'Lead Generation', 'Customer Acquisition', 'B2B Sales', 'B2C Sales', 'Account Management',
  'CRM', 'Salesforce', 'HubSpot', 'Marketing Automation', 'Growth Hacking', 'Conversion Optimization',

  // Healthcare & Medical
  'Medical Research', 'Clinical Research', 'Patient Care', 'Healthcare Management',
  'Medical Writing', 'Pharmacology', 'Epidemiology', 'Biostatistics', 'Clinical Trials',
  'Medical Device Development', 'Healthcare Analytics', 'Public Health', 'Nursing',
  'Physical Therapy', 'Occupational Therapy', 'Medical Coding', 'Healthcare Compliance',
  'Telemedicine', 'Electronic Health Records', 'Medical Imaging',

  // Design & UX
  'UI/UX Design', 'User Experience', 'User Interface Design', 'Figma', 'Adobe XD', 'Sketch',
  'Photoshop', 'Illustrator', 'InDesign', 'Wireframing', 'Prototyping', 'Design Thinking',
  'User Research', 'Information Architecture', 'Interaction Design',

  // Education & Training
  'Curriculum Development', 'Instructional Design', 'Educational Technology', 'E-Learning',
  'Training and Development', 'Adult Learning', 'Classroom Management', 'Assessment Design',
  'Educational Research', 'Academic Writing', 'Student Counseling', 'Educational Leadership',
  'Online Teaching', 'Learning Management Systems', 'Educational Psychology',

  // Legal & Compliance
  'Legal Research', 'Contract Law', 'Corporate Law', 'Intellectual Property', 'Litigation',
  'Compliance', 'Regulatory Affairs', 'Risk Assessment', 'Legal Writing', 'Due Diligence',
  'Employment Law', 'Immigration Law', 'Real Estate Law', 'Tax Law', 'International Law',

  // Engineering & Manufacturing
  'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering', 'Chemical Engineering',
  'Industrial Engineering', 'Environmental Engineering', 'Aerospace Engineering', 'Biomedical Engineering',
  'Manufacturing', 'Quality Control', 'Lean Manufacturing', 'Six Sigma', 'Process Engineering',
  'Product Development', 'CAD', 'SolidWorks', 'AutoCAD', 'Project Engineering',

  // Science & Research
  'Research', 'Scientific Research', 'Laboratory Skills', 'Data Collection', 'Statistical Analysis',
  'Literature Review', 'Grant Writing', 'Research Design', 'Experimental Design', 'Peer Review',
  'Scientific Writing', 'Biology', 'Chemistry', 'Physics', 'Environmental Science', 'Geology',
  'Materials Science', 'Biotechnology', 'Microbiology', 'Genetics', 'Biochemistry',

  // Business & Finance
  'Business Analysis', 'Financial Analysis', 'Market Research', 'Sales', 'Marketing',
  'Digital Marketing', 'SEO', 'SEM', 'Social Media Marketing', 'Content Marketing',
  'Email Marketing', 'CRM', 'Salesforce', 'HubSpot',

  // Mathematics & Analytics
  'Statistics', 'Statistical Modeling', 'Calculus', 'Linear Algebra', 'Probability Theory',
  'Mathematical Modeling', 'Quantitative Analysis', 'Econometrics', 'Operations Research',
  'Mathematical Optimization', 'Game Theory', 'Time Series Analysis', 'Regression Analysis',
  'A/B Testing', 'Hypothesis Testing', 'Survey Design', 'Sampling Methods',

  // Human Resources
  'Human Resources', 'Talent Acquisition', 'Recruiting', 'Employee Relations', 'Performance Management',
  'Compensation and Benefits', 'HR Analytics', 'Organizational Psychology', 'Training and Development',
  'Diversity and Inclusion', 'Employee Engagement', 'HR Information Systems', 'Labor Relations',
  'Succession Planning', 'Workforce Planning', 'Employee Development', 'HR Compliance',

  // Media & Communications
  'Content Creation', 'Copywriting', 'Journalism', 'Public Relations', 'Communications Strategy',
  'Media Relations', 'Crisis Communications', 'Brand Communications', 'Technical Writing',
  'Creative Writing', 'Video Production', 'Photography', 'Graphic Design', 'Social Media Management',
  'Podcasting', 'Broadcasting', 'Event Planning', 'Community Management',

  // Security
  'Cybersecurity', 'Information Security', 'Network Security', 'Penetration Testing',
  'Ethical Hacking', 'CISSP', 'CEH', 'CompTIA Security+', 'ISO 27001', 'GDPR',

  // Architecture & Construction
  'Architecture', 'Architectural Design', 'Construction Management', 'Project Management',
  'Building Information Modeling', 'Sustainable Design', 'Urban Planning', 'Interior Design',
  'Landscape Architecture', 'Construction Planning', 'Cost Estimation', 'Building Codes',
  'Structural Engineering', 'MEP Engineering', 'Construction Safety', 'Real Estate Development',

  // Agriculture & Environment
  'Agriculture', 'Sustainable Agriculture', 'Environmental Science', 'Environmental Consulting',
  'Climate Change', 'Renewable Energy', 'Water Management', 'Soil Science', 'Crop Management',
  'Livestock Management', 'Food Safety', 'Agricultural Research', 'Environmental Policy',
  'Conservation', 'Waste Management', 'Environmental Impact Assessment',

  // Arts & Creative
  'Graphic Design', 'Web Design', 'UI/UX Design', 'Visual Design', 'Creative Direction',
  'Art Direction', 'Illustration', 'Animation', 'Video Editing', 'Music Production',
  'Sound Design', 'Creative Writing', 'Art History', 'Fine Arts', 'Digital Art',
  'Typography', 'Branding', 'Package Design', 'Exhibition Design',

  // Hospitality & Tourism
  'Hotel Management', 'Restaurant Management', 'Event Management', 'Tourism Management',
  'Customer Service', 'Guest Relations', 'Food and Beverage', 'Revenue Management',
  'Hospitality Marketing', 'Travel Planning', 'Catering', 'Conference Management',

  // Transportation & Logistics
  'Supply Chain Management', 'Logistics', 'Transportation Management', 'Warehouse Management',
  'Inventory Management', 'Procurement', 'Vendor Management', 'Distribution', 'Fleet Management',
  'Import/Export', 'Customs Compliance', 'Freight Management', 'Materials Management',

  // Architecture & System Design
  'System Architecture', 'Software Architecture', 'System Design', 'Distributed Systems',
  'Load Balancing', 'Caching', 'Message Queues', 'Event Streaming', 'Apache Kafka',
  'RabbitMQ', 'API Design', 'Database Design',

  // Soft Skills & Leadership
  'Leadership', 'Team Leadership', 'Communication', 'Public Speaking', 'Presentation Skills',
  'Negotiation', 'Conflict Resolution', 'Problem Solving', 'Critical Thinking', 'Decision Making',
  'Time Management', 'Project Management', 'Collaboration', 'Teamwork', 'Adaptability',
  'Creativity', 'Innovation', 'Emotional Intelligence', 'Mentoring', 'Coaching',
  'Customer Service', 'Relationship Building', 'Cultural Awareness', 'Multilingual Communication',

  // Project Management & Methodologies
  'Project Management', 'PMP', 'Agile', 'Scrum', 'Kanban', 'Lean', 'Six Sigma', 'PRINCE2',
  'Waterfall', 'Risk Management', 'Quality Management', 'Program Management', 'Portfolio Management',
  'Change Management', 'Stakeholder Management', 'Resource Management', 'Schedule Management',

  // Digital Tools & Software
  'Microsoft Office', 'Excel', 'PowerPoint', 'Word', 'Microsoft Project', 'Outlook',
  'Google Workspace', 'Slack', 'Microsoft Teams', 'Zoom', 'Trello', 'Asana', 'Monday.com',
  'Notion', 'Salesforce', 'HubSpot', 'SAP', 'Oracle', 'QuickBooks', 'Adobe Creative Suite',
  'Photoshop', 'Illustrator', 'InDesign', 'Figma', 'Adobe XD', 'Sketch', 'Canva',

  // Version Control & Tools
  'Git', 'SVN', 'Mercurial', 'JIRA', 'Confluence', 'Slack', 'Microsoft Teams', 'Zoom',
  'Trello', 'Asana', 'Monday.com', 'Notion', 'VS Code', 'IntelliJ IDEA', 'Eclipse',

  // Quality & Testing
  'Quality Assurance', 'Quality Control', 'Testing', 'Manual Testing', 'Automated Testing',
  'Performance Testing', 'Load Testing', 'Security Testing', 'API Testing', 'Regression Testing',
  'Bug Tracking', 'Test Planning', 'Test Design', 'Test Execution', 'ISO Standards',

  // Security & Compliance
  'Cybersecurity', 'Information Security', 'Network Security', 'Data Privacy', 'GDPR',
  'Compliance', 'Risk Assessment', 'Security Auditing', 'Penetration Testing', 'Ethical Hacking',
  'Security Architecture', 'Incident Response', 'Vulnerability Assessment', 'Security Training',

  // Language Skills
  'English', 'Spanish', 'French', 'German', 'Mandarin', 'Arabic', 'Portuguese', 'Russian',
  'Italian', 'Japanese', 'Korean', 'Dutch', 'Turkish', 'Hebrew', 'Hindi', 'Translation',
  'Interpretation', 'Technical Translation', 'Localization', 'Cross-cultural Communication',

  // Quality Assurance
  'Quality Assurance', 'Manual Testing', 'Automated Testing', 'Performance Testing',
  'Load Testing', 'Security Testing', 'API Testing', 'Regression Testing', 'Bug Tracking',
]
