import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { BaseNodeHandler, NodeExecutionResult } from './base-node-handler';
import { WorkflowNode } from '../../entities/workflow.entity';
import { WorkflowContext } from '../workflow-context';

/**
 * EmailNodeHandler - Sends emails via integration service
 * Supports template rendering and dynamic recipient lists
 */
@Injectable()
export class EmailNodeHandler extends BaseNodeHandler {
  private readonly logger = new Logger(EmailNodeHandler.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    super();
  }

  async execute(node: WorkflowNode, context: WorkflowContext): Promise<NodeExecutionResult> {
    try {
      const resolvedData = this.resolveNodeData(node.data, context);
      const {
        to,
        cc,
        bcc,
        subject,
        body,
        html,
        template,
        templateData,
        from,
        replyTo,
        attachments,
      } = resolvedData;

      if (!to) {
        return this.failure('Email recipient (to) is required');
      }

      if (!subject) {
        return this.failure('Email subject is required');
      }

      if (!body && !html && !template) {
        return this.failure('Email must have body, html, or template');
      }

      const emailPayload = {
        to: Array.isArray(to) ? to : [to],
        cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
        bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
        subject,
        body,
        html,
        template,
        templateData,
        from: from || this.configService.get<string>('DEFAULT_EMAIL_FROM'),
        replyTo,
        attachments,
      };

      this.logger.log(`Sending email to ${emailPayload.to.join(', ')}`, {
        subject,
        nodeId: node.id,
      });

      // Call email service (could be internal or external like SendGrid, Mailgun, etc.)
      const emailServiceUrl = this.configService.get<string>(
        'EMAIL_SERVICE_URL',
        'http://localhost:3003'
      );

      const response = await firstValueFrom(
        this.httpService.post(`${emailServiceUrl}/api/emails/send`, emailPayload, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      const output = {
        messageId: response.data.messageId,
        recipients: emailPayload.to,
        subject,
        sentAt: new Date().toISOString(),
        status: response.data.status || 'sent',
      };

      this.logger.log(`Email sent successfully`, { messageId: output.messageId });

      return this.success(output);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || String(error);
      this.logger.error(`Email sending failed: ${errorMessage}`, error.stack);
      return this.failure(`Email sending failed: ${errorMessage}`);
    }
  }

  validate(node: WorkflowNode): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    if (!node.data.to) {
      errors.push('Email recipient (to) is required');
    }

    if (!node.data.subject) {
      errors.push('Email subject is required');
    }

    if (!node.data.body && !node.data.html && !node.data.template) {
      errors.push('Email must have body, html, or template');
    }

    if (node.data.template && !node.data.templateData) {
      errors.push('templateData is required when using template');
    }

    // Validate email format (basic check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const validateEmail = (email: string) => {
      if (email && typeof email === 'string' && !emailRegex.test(email)) {
        errors.push(`Invalid email format: ${email}`);
      }
    };

    if (typeof node.data.to === 'string') {
      validateEmail(node.data.to);
    } else if (Array.isArray(node.data.to)) {
      node.data.to.forEach((email: string) => validateEmail(email));
    }

    if (node.data.from && typeof node.data.from === 'string') {
      validateEmail(node.data.from);
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
