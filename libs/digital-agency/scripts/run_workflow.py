#!/usr/bin/env python3
"""
Script to execute domain handoff workflows.
"""

import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
import importlib


WORKFLOW_MAP = {
    "offer_to_marketing": "workflows.offer_to_marketing.OfferToMarketingWorkflow",
    "marketing_to_sales": "workflows.marketing_to_sales.MarketingToSalesWorkflow",
    "sales_to_fulfillment": "workflows.sales_to_fulfillment.SalesToFulfillmentWorkflow",
    "fulfillment_to_feedback": "workflows.fulfillment_to_feedback.FulfillmentToFeedbackWorkflow",
    "feedback_to_offer": "workflows.feedback_to_offer.FeedbackToOfferWorkflow"
}


def load_workflow_class(workflow_name: str):
    """
    Load workflow class by name.

    Args:
        workflow_name: Name of the workflow

    Returns:
        Workflow class
    """
    if workflow_name not in WORKFLOW_MAP:
        raise ValueError(f"Unknown workflow: {workflow_name}")

    module_path, class_name = WORKFLOW_MAP[workflow_name].rsplit('.', 1)
    module = importlib.import_module(module_path)
    return getattr(module, class_name)


def load_input_data(input_path: str) -> dict:
    """
    Load input data from file.

    Args:
        input_path: Path to input JSON file

    Returns:
        Dict containing input data
    """
    with open(input_path, 'r') as f:
        return json.load(f)


def save_output_data(output_path: str, data: dict):
    """
    Save output data to file.

    Args:
        output_path: Path to output file
        data: Data to save
    """
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"Output saved to: {output_path}")


def execute_workflow(workflow_name: str, input_data: dict,
                     verbose: bool = False) -> dict:
    """
    Execute a workflow.

    Args:
        workflow_name: Name of the workflow to execute
        input_data: Input data for the workflow
        verbose: Print verbose output

    Returns:
        Dict containing workflow result
    """
    if verbose:
        print(f"\nExecuting workflow: {workflow_name}")
        print(f"Input data: {json.dumps(input_data, indent=2)}\n")

    # Load workflow class
    WorkflowClass = load_workflow_class(workflow_name)

    # Initialize workflow
    workflow = WorkflowClass()

    # Execute workflow
    result = workflow.execute(input_data)

    if verbose:
        print(f"\nWorkflow execution completed")
        print(f"Status: {workflow.status}")
        print(f"Workflow ID: {workflow.workflow_id}")

    return result


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Execute domain handoff workflows")
    parser.add_argument("workflow", choices=list(WORKFLOW_MAP.keys()),
                       help="Workflow to execute")
    parser.add_argument("--input", "-i", required=True,
                       help="Path to input JSON file")
    parser.add_argument("--output", "-o",
                       help="Path to save output (default: data/outputs/)")
    parser.add_argument("--verbose", "-v", action="store_true",
                       help="Verbose output")

    args = parser.parse_args()

    print("Workflow Execution Tool")
    print("=" * 50)
    print(f"Workflow: {args.workflow}")
    print(f"Input: {args.input}")

    try:
        # Load input data
        input_data = load_input_data(args.input)

        # Execute workflow
        result = execute_workflow(args.workflow, input_data, args.verbose)

        # Print result
        print("\n" + "=" * 50)
        print("Result:")
        print(json.dumps(result, indent=2))

        # Save output
        if args.output:
            output_path = args.output
        else:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            output_path = f"data/outputs/{args.workflow}_{timestamp}.json"

        save_output_data(output_path, result)

        # Exit with appropriate code
        if result.get('success'):
            print("\n✓ Workflow executed successfully")
            sys.exit(0)
        else:
            print("\n✗ Workflow execution failed")
            sys.exit(1)

    except FileNotFoundError as e:
        print(f"\nError: Input file not found: {e}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"\nError: Invalid JSON in input file: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
