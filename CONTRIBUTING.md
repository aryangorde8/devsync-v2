# Contributing to DevSync

Thank you for your interest in contributing to DevSync! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)

## 📜 Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please:

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/devsync.git
   cd devsync
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/aryangorde8/devsync.git
   ```

## 🛠️ Development Setup

### Prerequisites

- Python 3.12+
- Node.js 20+
- Docker & Docker Compose
- Git

### Backend Setup

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Set up environment
cp ../.env.example ../.env

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver 8001
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Pre-commit Hooks

We use pre-commit hooks to ensure code quality:

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run on all files (optional)
pre-commit run --all-files
```

## ✏️ Making Changes

1. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes** following our code style guidelines

3. **Test your changes** thoroughly

4. **Commit your changes** using conventional commits

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples
```bash
feat(auth): add password reset functionality
fix(api): handle null response in project list
docs(readme): update installation instructions
test(portfolio): add unit tests for Project model
```

## 🔄 Pull Request Process

1. **Update your fork** with the latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request** on GitHub with:
   - Clear title following commit conventions
   - Description of changes
   - Screenshots (if UI changes)
   - Reference to related issues

4. **Address review feedback** promptly

5. **Ensure CI passes** before requesting merge

## 🎨 Code Style

### Python (Backend)

- Follow PEP 8 guidelines
- Use Black for formatting (line length: 88)
- Use isort for import sorting
- Add type hints where possible
- Write docstrings for public functions

```python
def create_project(
    user: User,
    title: str,
    description: str,
) -> Project:
    """
    Create a new project for a user.
    
    Args:
        user: The project owner
        title: Project title
        description: Project description
    
    Returns:
        The created Project instance
    
    Raises:
        ValidationError: If title is empty
    """
    if not title:
        raise ValidationError("Title is required")
    
    return Project.objects.create(
        user=user,
        title=title,
        description=description,
    )
```

### TypeScript (Frontend)

- Use TypeScript strict mode
- Follow ESLint rules
- Use functional components with hooks
- Add proper type definitions

```typescript
interface ProjectCardProps {
  project: Project;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export function ProjectCard({ 
  project, 
  onEdit, 
  onDelete 
}: ProjectCardProps) {
  // Component implementation
}
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest -v
pytest --cov=. --cov-report=html
```

### Frontend Tests

```bash
cd frontend
npm test
npm run test:coverage
```

### Writing Tests

- Write tests for new features
- Update tests when modifying existing code
- Aim for meaningful coverage, not just numbers
- Test edge cases and error conditions

## 📁 Project Structure

```
devsync/
├── backend/              # Django REST API
│   ├── accounts/        # User authentication
│   ├── portfolio/       # Portfolio features
│   ├── core/           # Shared utilities
│   └── tests/          # Backend tests
├── frontend/            # Next.js application
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/ # React components
│   │   ├── lib/       # Utilities
│   │   └── __tests__/ # Frontend tests
├── k8s/                # Kubernetes manifests
├── terraform/          # Infrastructure as Code
└── scripts/           # Automation scripts
```

## 🆘 Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Security**: Email security concerns privately

## 🙏 Thank You!

Your contributions help make DevSync better for everyone. We appreciate your time and effort!
