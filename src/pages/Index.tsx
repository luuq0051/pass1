import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Shield, Bug } from "lucide-react";
import { PasswordCard } from "@/components/PasswordCard";
import { PasswordForm } from "@/components/PasswordForm";
import { SearchBar } from "@/components/SearchBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DatabaseStatus } from "@/components/DatabaseStatus";
import { HeroSection } from "@/components/HeroSection";
import { StatsSection, type StatsData } from "@/components/StatsSection";
import { LoadingState, ErrorState, EmptyState } from "@/components/StateComponents";
import { Footer } from "@/components/Footer";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { usePasswords } from "@/hooks/use-passwords";
import { useFormState } from "@/hooks/use-form-state";
import { PasswordEntry, PasswordInsert } from "@/lib/types/models";
import { TIMING } from "@/lib/constants/app-constants";
import { DOMAIN_CONFIG, API_CONFIG } from "@/lib/config/app-config";

// Constants từ app-constants để dễ bảo trì
const { SEARCH_DEBOUNCE_DELAY, ANIMATION_STAGGER_DELAY, MAX_ANIMATION_DELAY } = TIMING;

/**
 * Custom hook để tối ưu animation delays
 * Memoized để tránh tính toán lại không cần thiết
 */
const useAnimationDelays = (passwordsLength: number) => {
  return useMemo(() => {
    return Array.from({ length: passwordsLength }, (_, index) =>
      `${Math.min(index * ANIMATION_STAGGER_DELAY, MAX_ANIMATION_DELAY)}ms`
    );
  }, [passwordsLength]);
};

/**
 * Custom hook để xử lý các operations của password
 * Tách biệt logic để dễ test và maintain
 * Updated để sử dụng hook mới với hybrid approach
 */
const usePasswordOperations = () => {
  const { showSuccess, showError } = useToastNotifications();
  
  // Sử dụng hook mới với API sync enabled trong development
  const {
    passwords,
    loading,
    error,
    stats,
    searchPasswords,
    addPassword,
    updatePassword,
    deletePassword
  } = usePasswords({
    enableApiSync: API_CONFIG.ENABLE_SYNC,
    autoInitialize: true
  });

  const {
    isFormOpen,
    editEntry,
    formMode,
    isEditMode,
    openAddForm,
    openEditForm,
    closeForm,
    resetToAddMode
  } = useFormState();

  // Handler cho save operation với error handling
  const handleSave = useCallback(async (entryData: PasswordInsert) => {
    try {
      if (editEntry) {
        await updatePassword(editEntry.id, entryData);
        showSuccess("Cập nhật thành công", "Mật khẩu đã được cập nhật");
      } else {
        await addPassword(entryData);
        showSuccess("Thêm thành công", "Mật khẩu mới đã được lưu");
      }
      resetToAddMode();
    } catch (err) {
      console.error('Lỗi khi lưu mật khẩu:', err);
      showError("Lỗi", err instanceof Error ? err.message : "Không thể lưu mật khẩu");
    }
  }, [editEntry, updatePassword, addPassword, resetToAddMode, showSuccess, showError]);

  // Handler cho edit operation
  const handleEdit = useCallback((entry: PasswordEntry) => {
    openEditForm(entry);
  }, [openEditForm]);

  // Handler cho delete operation với error handling
  const handleDelete = useCallback(async (id: string) => {
    try {
      await deletePassword(id);
    } catch (err) {
      console.error('Lỗi khi xóa mật khẩu:', err);
    }
  }, [deletePassword]);

  return {
    // Data
    passwords,
    loading,
    error,
    stats,
    // Form state
    isFormOpen,
    editEntry,
    formMode, // Thêm formMode
    // Actions
    searchPasswords,
    openAddForm,
    closeForm,
    handleSave,
    handleEdit,
    handleDelete
  };
};

/**
 * Trang chính của ứng dụng Memory Safe Guard
 * Hiển thị danh sách mật khẩu và các chức năng quản lý
 * 
 * Updated để:
 * - Sử dụng IndexedDB làm primary storage
 * - Hỗ trợ API sync trong development
 * - Sử dụng types mới đã được chuẩn hóa
 * - Tối ưu performance với memoization
 */
const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDebug, setShowDebug] = useState(false);

  // Sử dụng custom hooks để tách biệt logic
  const {
    passwords,
    loading,
    error,
    stats,
    isFormOpen,
    editEntry,
    formMode, // Thêm formMode
    searchPasswords,
    openAddForm,
    closeForm,
    handleSave,
    handleEdit,
    handleDelete
  } = usePasswordOperations();

  // Tối ưu animation delays
  const animationDelays = useAnimationDelays(passwords.length);

  // Tìm kiếm với debounce sử dụng constant
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPasswords(searchQuery);
    }, SEARCH_DEBOUNCE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchPasswords]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header với sticky positioning */}
      <div className="glass-effect sticky top-0 z-50 border-b border-border/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-primary pulse-glow">
                <Shield className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient">{DOMAIN_CONFIG.APP_NAME}</h1>
                <p className="text-muted-foreground font-medium">{DOMAIN_CONFIG.APP_DESCRIPTION}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Database Status - hiển thị trạng thái kết nối */}
              <DatabaseStatus className="hidden md:flex" />
              <ThemeToggle />
              <Button
                onClick={openAddForm}
                variant="default"
                className="gap-2 shadow-button hover:shadow-glow transition-all duration-300 px-6 py-3"
              >
                <Plus className="w-5 h-5" />
                Thêm mật khẩu
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 flex-1">
        {/* Debug Panel - conditional rendering */}


        {/* Hero Section - sử dụng component đã tách */}
        <HeroSection onAddPassword={openAddForm} />

        {/* Search Bar */}
        <div className="max-w-lg mx-auto mb-12">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Stats Section - sử dụng component đã tách */}
        <StatsSection stats={stats} />

        {/* Password Grid với conditional rendering được tối ưu */}
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} />
        ) : passwords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {passwords.map((entry, index) => (
              <div
                key={entry.id}
                className="animate-fade-in"
                style={{ animationDelay: animationDelays[index] }}
              >
                <PasswordCard
                  entry={entry}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState searchQuery={searchQuery} onAddPassword={openAddForm} />
        )}
      </div>

      {/* Footer với thông tin domain */}
      <Footer />

      {/* Form Modal */}
      <PasswordForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSave={handleSave}
        editEntry={editEntry}
        formMode={formMode}
      />
    </div>
  );
};

export default Index;