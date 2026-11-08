package match.flavornav.service;

import match.flavornav.mapper.AuditConfigMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuditConfigService {

    @Autowired
    private AuditConfigMapper auditConfigMapper;

    /** 当前审核模式：keyword 或 ai，默认 keyword */
    public String getAuditMode() {
        try {
            String mode = auditConfigMapper.findAuditMode();
            return (mode == null || mode.trim().isEmpty()) ? "keyword" : mode.trim();
        } catch (Exception e) {
            return "keyword";
        }
    }

    public void setAuditMode(String mode) {
        auditConfigMapper.updateAuditMode(mode);
    }
}