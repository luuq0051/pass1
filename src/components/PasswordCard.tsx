import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Copy, Edit, Trash2, User, Key, Globe, Calendar } from "lucide-react";
import { PasswordEntry } from "@/lib/types/models";
import { useSecureClipboard } from "@/hooks/use-clipboard";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { logger } from "@/lib/utils/logger";

interface PasswordCardProps {
  entry: PasswordEntry;
  onEdit: (entry: PasswordEntry) => void;
  onDelete: (id: string) => void;
}

export const PasswordCard = ({ entry, onEdit, onDelete }: PasswordCardProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const { copyToClipboard } = useSecureClipboard();

  const handleCopyUsername = async () => {
    await copyToClipboard(entry.username, {
      label: "Tên đăng nhập",
      source: "password-card",
      sensitive: false
    });
    logger.debug('Username copied', { service: entry.service });
  };

  const handleCopyPassword = async () => {
    await copyToClipboard(entry.password, {
      label: "Mật khẩu", 
      source: "password-card",
      sensitive: true
    });
    logger.debug('Password copied', { service: entry.service });
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
    logger.debug('Password visibility toggled', { 
      service: entry.service, 
      visible: !showPassword 
    });
  };

  // Format thời gian cập nhật - timestamps bây giờ luôn có giá trị
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy HH:mm", { locale: vi });
    } catch (error) {
      return "Không xác định";
    }
  };

  return (
    <Card className="hover:shadow-glow transition-all duration-300 group">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="w-5 h-5 text-primary" />
          {entry.service}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="flex-1 font-mono">{entry.username}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyUsername}
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Key className="w-4 h-4 text-muted-foreground" />
          <span className="flex-1 font-mono">
            {showPassword ? entry.password : "••••••••"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleTogglePassword}
            className="h-8 w-8"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyPassword}
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <Calendar className="w-3 h-3" />
          <span>Cập nhật: {formatDate(entry.updatedAt)}</span>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(entry)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            Chỉnh sửa
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(entry.id)}
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Xóa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};