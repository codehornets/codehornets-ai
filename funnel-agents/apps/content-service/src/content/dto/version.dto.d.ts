export declare class CreateVersionDto {
    change_summary: string;
    changed_by?: string;
}
export declare class VersionCompareDto {
    version1_id: string;
    version2_id: string;
}
export declare class RollbackVersionDto {
    version_id: string;
    rollback_reason?: string;
}
