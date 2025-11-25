import { AggregateRoot, UniqueId } from '../shared-kernel';
import { AgentTemplateCreatedEvent, AgentTemplatePublishedEvent } from './agent-template.events';

export interface AgentPersona {
  firstName: string;
  lastName: string;
  title: string;
  initials: string;
}

export interface AgentTemplateProps {
  name: string;
  description?: string;
  type?: string;
  domain: string;
  skills: string[];
  tools?: string[];
  promptTemplate?: string;
  defaultSettings?: Record<string, any>;
  category?: string;
  isPublic: boolean;
  persona?: AgentPersona;
  useCases?: string[];
  typicalTasks?: string[];
  exampleTasks?: string[];
  overview?: string[];
  commonlyUsedWith?: string[];
  popularityLabel?: string;
}

export class AgentTemplate extends AggregateRoot<AgentTemplateProps> {
  private constructor(props: AgentTemplateProps, id?: UniqueId) {
    super(props, id);
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get type(): string | undefined {
    return this.props.type;
  }

  get domain(): string {
    return this.props.domain;
  }

  get skills(): string[] {
    return this.props.skills;
  }

  get tools(): string[] {
    return this.props.tools || [];
  }

  get promptTemplate(): string | undefined {
    return this.props.promptTemplate;
  }

  get defaultSettings(): Record<string, any> | undefined {
    return this.props.defaultSettings;
  }

  get category(): string | undefined {
    return this.props.category;
  }

  get isPublic(): boolean {
    return this.props.isPublic;
  }

  get persona(): AgentPersona | undefined {
    return this.props.persona;
  }

  get useCases(): string[] {
    return this.props.useCases || [];
  }

  get typicalTasks(): string[] {
    return this.props.typicalTasks || [];
  }

  get exampleTasks(): string[] {
    return this.props.exampleTasks || [];
  }

  get overview(): string[] {
    return this.props.overview || [];
  }

  get commonlyUsedWith(): string[] {
    return this.props.commonlyUsedWith || [];
  }

  get popularityLabel(): string | undefined {
    return this.props.popularityLabel;
  }

  public static create(props: AgentTemplateProps, id?: UniqueId): AgentTemplate {
    const template = new AgentTemplate(props, id);
    template.addDomainEvent(
      new AgentTemplateCreatedEvent(template.id.value, template.name, template.domain)
    );
    return template;
  }

  public static reconstitute(props: AgentTemplateProps, id: UniqueId): AgentTemplate {
    return new AgentTemplate(props, id);
  }

  public publish(): void {
    if (!this.props.isPublic) {
      this.props.isPublic = true;
      this.touch();
      this.addDomainEvent(new AgentTemplatePublishedEvent(this.id.value, this.name));
    }
  }

  public unpublish(): void {
    if (this.props.isPublic) {
      this.props.isPublic = false;
      this.touch();
    }
  }

  public updateDetails(updates: {
    name?: string;
    description?: string;
    domain?: string;
    category?: string;
  }): void {
    if (updates.name !== undefined) this.props.name = updates.name;
    if (updates.description !== undefined) this.props.description = updates.description;
    if (updates.domain !== undefined) this.props.domain = updates.domain;
    if (updates.category !== undefined) this.props.category = updates.category;
    this.touch();
  }

  public updateSkills(skills: string[]): void {
    this.props.skills = skills;
    this.touch();
  }

  public addSkill(skill: string): void {
    if (!this.props.skills.includes(skill)) {
      this.props.skills.push(skill);
      this.touch();
    }
  }

  public removeSkill(skill: string): void {
    this.props.skills = this.props.skills.filter((s) => s !== skill);
    this.touch();
  }

  public updatePromptTemplate(template: string): void {
    this.props.promptTemplate = template;
    this.touch();
  }

  public updateDefaultSettings(settings: Record<string, any>): void {
    this.props.defaultSettings = { ...this.props.defaultSettings, ...settings };
    this.touch();
  }
}
