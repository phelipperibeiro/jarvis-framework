# Code - Skill Validator

## Visão Geral

Diagrama de código (Nível 4) do componente Skill Validator, mostrando as classes e interfaces responsáveis por validar a estrutura dos skills.

> **Nota**: Este nível é raramente usado. Documentado aqui apenas como exemplo de referência para algoritmos complexos ou padrões críticos.

## Diagrama

```plantuml
@startuml
!theme plain
skinparam classAttributeIconSize 0
skinparam classFontStyle bold

title Diagrama de Código - Skill Validator

' === INTERFACES ===
interface ISkillValidator {
  +validate(skill: Skill): ValidationResult
  +validateFrontmatter(frontmatter: Frontmatter): ValidationResult
  +validateContent(content: string): ValidationResult
}

interface IValidationRule {
  +name: string
  +validate(value: any): boolean
  +getErrorMessage(): string
}

interface ISkillRepository {
  +findByName(name: string): Promise<Skill>
  +exists(name: string): Promise<boolean>
}

' === VALUE OBJECTS ===
class SkillName <<Value Object>> {
  -value: string
  +{static} create(value: string): SkillName
  +validate(): boolean
  +toString(): string
  +isKebabCase(): boolean
}

class SkillDescription <<Value Object>> {
  -value: string
  -trigger: string
  +{static} create(value: string): SkillDescription
  +hasTrigger(): boolean
  +getTrigger(): string
}

' === ENTIDADES ===
class Skill <<Entity>> {
  -name: SkillName
  -description: SkillDescription
  -argumentHint: string
  -allowedTools: string[]
  -content: string
  --
  +{static} create(props: CreateSkillProps): Skill
  +getName(): SkillName
  +getDescription(): SkillDescription
  +getAllowedTools(): string[]
  +hasRequiredFields(): boolean
}

class Frontmatter <<Value Object>> {
  -name: string
  -description: string
  -argumentHint: string
  -disableModelInvocation: boolean
  -allowedTools: string[]
  --
  +{static} parse(yaml: string): Frontmatter
  +toSkill(): Skill
  +isValid(): boolean
}

class ValidationResult <<Value Object>> {
  -isValid: boolean
  -errors: ValidationError[]
  --
  +{static} success(): ValidationResult
  +{static} failure(errors: ValidationError[]): ValidationResult
  +addError(error: ValidationError): void
  +hasErrors(): boolean
  +getErrors(): ValidationError[]
}

class ValidationError <<Value Object>> {
  -field: string
  -message: string
  -rule: string
  --
  +{static} create(field: string, message: string, rule: string): ValidationError
  +toString(): string
}

' === REGRAS DE VALIDAÇÃO ===
class RequiredFieldRule <<Rule>> {
  -fieldName: string
  +validate(value: any): boolean
  +getErrorMessage(): string
}

class KebabCaseRule <<Rule>> {
  +validate(value: string): boolean
  +getErrorMessage(): string
}

class DescriptionTriggerRule <<Rule>> {
  +validate(value: string): boolean
  +getErrorMessage(): string
}

' === SERVIÇO DE VALIDAÇÃO ===
class SkillValidator <<Service>> {
  -rules: IValidationRule[]
  -repository: ISkillRepository
  --
  +validate(skill: Skill): ValidationResult
  +validateFrontmatter(frontmatter: Frontmatter): ValidationResult
  +validateContent(content: string): ValidationResult
  -applyRules(value: any, rules: IValidationRule[]): ValidationError[]
}

' === RELACIONAMENTOS ===
Skill -- SkillName : identity
Skill -- SkillDescription : contains
Skill ..> Frontmatter : created from

Frontmatter ..> Skill : creates

ValidationResult -- ValidationError : contains

SkillValidator ..|> ISkillValidator : implements
SkillValidator --> IValidationRule : uses
SkillValidator --> ISkillRepository : uses
SkillValidator ..> ValidationResult : returns
SkillValidator ..> Skill : validates

RequiredFieldRule ..|> IValidationRule
KebabCaseRule ..|> IValidationRule
DescriptionTriggerRule ..|> IValidationRule

@enduml
```

## Elementos

| Elemento | Tipo | Descrição | Responsabilidade |
|----------|------|-----------|------------------|
| ISkillValidator | Interface | Contrato de validação de skills | Define métodos de validação |
| IValidationRule | Interface | Contrato de regra de validação | Define estrutura de regras |
| ISkillRepository | Interface | Contrato de repositório | Acesso a skills existentes |
| SkillName | Value Object | Nome do skill | Validação de formato kebab-case |
| SkillDescription | Value Object | Descrição com trigger | Extração de trigger de uso |
| Skill | Entity | Entidade principal | Representa um skill completo |
| Frontmatter | Value Object | Metadados YAML | Parse e validação de frontmatter |
| ValidationResult | Value Object | Resultado da validação | Agrupa erros encontrados |
| ValidationError | Value Object | Erro individual | Representa um erro específico |
| RequiredFieldRule | Rule | Regra de campo obrigatório | Valida presença de campo |
| KebabCaseRule | Rule | Regra de formato | Valida formato kebab-case |
| DescriptionTriggerRule | Rule | Regra de trigger | Valida presença de "Use quando" |
| SkillValidator | Service | Serviço de validação | Orquestra validação completa |

## Padrões Utilizados

| Padrão | Onde | Por quê |
|--------|------|---------|
| Value Object | SkillName, ValidationResult | Imutabilidade e validação no construtor |
| Strategy | IValidationRule | Regras intercambiáveis |
| Repository | ISkillRepository | Abstração de acesso a dados |
| Result Object | ValidationResult | Evita exceções para fluxo de validação |

## ADRs Relacionados

| ADR | Título | Impacto |
|-----|--------|---------|
| ADR-005 | Padrão de validação | Define uso de Result Object |
| ADR-006 | Value Objects para domínio | Define imutabilidade |

## Changelog

### [2025-01-24] - v1.0
- Criação: Diagrama de código do Skill Validator
- Motivo: Documentar padrões de validação como referência
