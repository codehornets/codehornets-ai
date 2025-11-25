import { describe, it, expect } from 'vitest';
import { createPageUrl } from '../utils/index.ts';

describe('Navigation URL Generation', () => {
  it('should generate correct URLs for main pages', () => {
    expect(createPageUrl('Dashboard')).toBe('/Dashboard');
    expect(createPageUrl('Agents')).toBe('/Agents');
    expect(createPageUrl('Workflows')).toBe('/Workflows');
    expect(createPageUrl('Tasks')).toBe('/Tasks');
    expect(createPageUrl('Leads')).toBe('/Leads');
    expect(createPageUrl('Contacts')).toBe('/Contacts');
    expect(createPageUrl('Deals')).toBe('/Deals');
    expect(createPageUrl('Settings')).toBe('/Settings');
  });

  it('should work with compound page names', () => {
    expect(createPageUrl('AgentDetail')).toBe('/AgentDetail');
    expect(createPageUrl('WorkflowBuilder')).toBe('/WorkflowBuilder');
    expect(createPageUrl('ClientWorkspace')).toBe('/ClientWorkspace');
    expect(createPageUrl('CampaignDetail')).toBe('/CampaignDetail');
  });

  it('should work with workspace and project pages', () => {
    expect(createPageUrl('Workspaces')).toBe('/Workspaces');
    expect(createPageUrl('Projects')).toBe('/Projects');
    expect(createPageUrl('Boards')).toBe('/Boards');
    expect(createPageUrl('BoardDetail')).toBe('/BoardDetail');
  });

  it('should work with analytics and integrations', () => {
    expect(createPageUrl('Analytics')).toBe('/Analytics');
    expect(createPageUrl('Integrations')).toBe('/Integrations');
    expect(createPageUrl('AgentPerformanceHub')).toBe('/AgentPerformanceHub');
  });

  it('should work with auth pages', () => {
    expect(createPageUrl('Login')).toBe('/Login');
    expect(createPageUrl('Signup')).toBe('/Signup');
    expect(createPageUrl('ForgotPassword')).toBe('/ForgotPassword');
  });

  it('should work with admin and profile pages', () => {
    expect(createPageUrl('AdminPanel')).toBe('/AdminPanel');
    expect(createPageUrl('Profile')).toBe('/Profile');
  });

  it('should work with content library', () => {
    expect(createPageUrl('ContentLibrary')).toBe('/ContentLibrary');
  });

  it('should work with campaigns', () => {
    expect(createPageUrl('Campaigns')).toBe('/Campaigns');
  });
});

describe('Navigation with Query Parameters', () => {
  it('should correctly combine base URL with query parameters', () => {
    const baseUrl = createPageUrl('AgentDetail');
    const withQuery = baseUrl + '?id=123';
    expect(withQuery).toBe('/AgentDetail?id=123');
  });

  it('should handle multiple query parameters', () => {
    const baseUrl = createPageUrl('Settings');
    const withQuery = baseUrl + '?tab=billing&section=plans';
    expect(withQuery).toBe('/Settings?tab=billing&section=plans');
  });

  it('should work with workflow builder queries', () => {
    const baseUrl = createPageUrl('WorkflowBuilder');
    const withQuery = baseUrl + '?id=workflow-123';
    expect(withQuery).toBe('/WorkflowBuilder?id=workflow-123');
  });

  it('should work with workspace queries', () => {
    const baseUrl = createPageUrl('ClientWorkspace');
    const withQuery = baseUrl + '?id=client-456&tab=projects';
    expect(withQuery).toBe('/ClientWorkspace?id=client-456&tab=projects');
  });
});
