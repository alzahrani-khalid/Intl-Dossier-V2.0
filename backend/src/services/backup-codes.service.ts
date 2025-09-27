export class BackupCodesService {
  generate(count = 10): string[] {
    const codes = new Set<string>();
    while (codes.size < count) {
      const code = Math.random().toString(36).slice(2, 10).toUpperCase();
      codes.add(code);
    }
    return Array.from(codes);
  }
}

export const backupCodesService = new BackupCodesService();

