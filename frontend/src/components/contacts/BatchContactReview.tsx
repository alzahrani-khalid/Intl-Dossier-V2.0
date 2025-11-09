/**
 * BatchContactReview Component
 * Part of: 027-contact-directory implementation - Phase 5 (Document Extraction)
 *
 * Mobile-first, RTL-ready batch contact review UI with inline editing.
 * Features checkbox selection, field editing, confidence badges, and batch operations.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckSquare, Square, AlertCircle, Trash2, Users } from 'lucide-react';
import { getConfidenceColor, getConfidenceLevel } from '@/hooks/useOCR';
import type { Database } from '@/types/contact-directory.types';

type ContactInsert = Database['public']['Tables']['cd_contacts']['Insert'];

export interface EditableContact extends Partial<ContactInsert> {
 id: string; // Temporary ID for editing
 selected: boolean;
}

interface BatchContactReviewProps {
 contacts: EditableContact[];
 onContactsChange: (contacts: EditableContact[]) => void;
 onImport: (selectedContacts: EditableContact[]) => void;
 onCancel: () => void;
 isImporting?: boolean;
}

export function BatchContactReview({
 contacts,
 onContactsChange,
 onImport,
 onCancel,
 isImporting = false,
}: BatchContactReviewProps) {
 const { t, i18n } = useTranslation('contacts');
 const isRTL = i18n.language === 'ar';

 // Calculate selected contacts
 const selectedContacts = useMemo(
 () => contacts.filter((c) => c.selected),
 [contacts]
 );

 const allSelected = contacts.length > 0 && selectedContacts.length === contacts.length;
 const someSelected = selectedContacts.length > 0 && selectedContacts.length < contacts.length;

 // Toggle all contacts selection
 const handleToggleAll = useCallback(() => {
 const newSelected = !allSelected;
 onContactsChange(
 contacts.map((contact) => ({
 ...contact,
 selected: newSelected,
 }))
 );
 }, [allSelected, contacts, onContactsChange]);

 // Toggle individual contact selection
 const handleToggleContact = useCallback(
 (contactId: string) => {
 onContactsChange(
 contacts.map((contact) =>
 contact.id === contactId
 ? { ...contact, selected: !contact.selected }
 : contact
 )
 );
 },
 [contacts, onContactsChange]
 );

 // Update contact field
 const handleFieldChange = useCallback(
 (contactId: string, field: keyof ContactInsert, value: any) => {
 onContactsChange(
 contacts.map((contact) =>
 contact.id === contactId
 ? { ...contact, [field]: value }
 : contact
 )
 );
 },
 [contacts, onContactsChange]
 );

 // Add email to contact
 const handleAddEmail = useCallback(
 (contactId: string) => {
 onContactsChange(
 contacts.map((contact) => {
 if (contact.id === contactId) {
 const emails = contact.email_addresses || [];
 return {
 ...contact,
 email_addresses: [...emails, ''],
 };
 }
 return contact;
 })
 );
 },
 [contacts, onContactsChange]
 );

 // Update email in contact
 const handleEmailChange = useCallback(
 (contactId: string, emailIndex: number, value: string) => {
 onContactsChange(
 contacts.map((contact) => {
 if (contact.id === contactId) {
 const emails = [...(contact.email_addresses || [])];
 emails[emailIndex] = value;
 return {
 ...contact,
 email_addresses: emails,
 };
 }
 return contact;
 })
 );
 },
 [contacts, onContactsChange]
 );

 // Remove email from contact
 const handleRemoveEmail = useCallback(
 (contactId: string, emailIndex: number) => {
 onContactsChange(
 contacts.map((contact) => {
 if (contact.id === contactId) {
 const emails = [...(contact.email_addresses || [])];
 emails.splice(emailIndex, 1);
 return {
 ...contact,
 email_addresses: emails,
 };
 }
 return contact;
 })
 );
 },
 [contacts, onContactsChange]
 );

 // Add phone to contact
 const handleAddPhone = useCallback(
 (contactId: string) => {
 onContactsChange(
 contacts.map((contact) => {
 if (contact.id === contactId) {
 const phones = contact.phone_numbers || [];
 return {
 ...contact,
 phone_numbers: [...phones, ''],
 };
 }
 return contact;
 })
 );
 },
 [contacts, onContactsChange]
 );

 // Update phone in contact
 const handlePhoneChange = useCallback(
 (contactId: string, phoneIndex: number, value: string) => {
 onContactsChange(
 contacts.map((contact) => {
 if (contact.id === contactId) {
 const phones = [...(contact.phone_numbers || [])];
 phones[phoneIndex] = value;
 return {
 ...contact,
 phone_numbers: phones,
 };
 }
 return contact;
 })
 );
 },
 [contacts, onContactsChange]
 );

 // Remove phone from contact
 const handleRemovePhone = useCallback(
 (contactId: string, phoneIndex: number) => {
 onContactsChange(
 contacts.map((contact) => {
 if (contact.id === contactId) {
 const phones = [...(contact.phone_numbers || [])];
 phones.splice(phoneIndex, 1);
 return {
 ...contact,
 phone_numbers: phones,
 };
 }
 return contact;
 })
 );
 },
 [contacts, onContactsChange]
 );

 // Remove contact from list
 const handleRemoveContact = useCallback(
 (contactId: string) => {
 onContactsChange(contacts.filter((contact) => contact.id !== contactId));
 },
 [contacts, onContactsChange]
 );

 // Handle import
 const handleImportClick = useCallback(() => {
 if (selectedContacts.length === 0) {
 alert(t('contactDirectory.documentExtraction.no_contacts_selected'));
 return;
 }
 onImport(selectedContacts);
 }, [selectedContacts, onImport, t]);

 return (
 <div className="space-y-4 sm:space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between gap-4">
 <CardTitle className="text-start">
 {t('contactDirectory.documentExtraction.review_contacts')}
 </CardTitle>
 <Badge variant="secondary" className="text-sm">
 <Users className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
 {selectedContacts.length} / {contacts.length}
 </Badge>
 </div>
 <CardDescription className="text-start">
 {t('contactDirectory.documentExtraction.review_description')}
 </CardDescription>
 </CardHeader>

 <CardContent className="space-y-4">
 {/* Select All / Deselect All */}
 <div className="flex items-center justify-between gap-4 pb-4 border-b">
 <div className="flex items-center gap-2">
 <Checkbox
 id="select-all"
 checked={allSelected}
 onCheckedChange={handleToggleAll}
 className="data-[state=indeterminate]:bg-primary"
 {...(someSelected ? { 'data-state': 'indeterminate' } : {})}
 />
 <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
 {allSelected
 ? t('contactDirectory.documentExtraction.deselect_all')
 : t('contactDirectory.documentExtraction.select_all')}
 </Label>
 </div>
 <Button
 variant="ghost"
 size="sm"
 onClick={handleToggleAll}
 className="text-xs"
 >
 {allSelected ? (
 <Square className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
 ) : (
 <CheckSquare className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
 )}
 {allSelected
 ? t('contactDirectory.documentExtraction.deselect_all')
 : t('contactDirectory.documentExtraction.select_all')}
 </Button>
 </div>

 {/* Contacts List */}
 <div className="space-y-4 max-h-[600px] overflow-y-auto">
 {contacts.map((contact) => (
 <Card
 key={contact.id}
 className={`border-2 transition-colors ${
 contact.selected
 ? 'border-primary bg-primary/5'
 : 'border-border'
 }`}
 >
 <CardContent className="p-4 space-y-3">
 {/* Contact Header */}
 <div className="flex items-start gap-3">
 <Checkbox
 checked={contact.selected}
 onCheckedChange={() => handleToggleContact(contact.id)}
 className="mt-1"
 />
 <div className="flex-1 space-y-3">
 {/* Full Name */}
 <div>
 <div className="flex items-center gap-2 mb-1">
 <Label className="text-xs text-muted-foreground text-start">
 {t('contactDirectory.form.full_name')}
 </Label>
 {contact.ocr_confidence && (
 <Badge className={`text-xs ${getConfidenceColor(contact.ocr_confidence)}`}>
 {contact.ocr_confidence}%
 </Badge>
 )}
 </div>
 <Input
 value={contact.full_name || ''}
 onChange={(e) =>
 handleFieldChange(contact.id, 'full_name', e.target.value)
 }
 placeholder={t('contactDirectory.form.full_name_placeholder')}
 className="h-9"
 />
 </div>

 {/* Position */}
 <div>
 <Label className="text-xs text-muted-foreground mb-1 block text-start">
 {t('contactDirectory.form.position')}
 </Label>
 <Input
 value={contact.position || ''}
 onChange={(e) =>
 handleFieldChange(contact.id, 'position', e.target.value)
 }
 placeholder={t('contactDirectory.form.position_placeholder')}
 className="h-9"
 />
 </div>

 {/* Email Addresses */}
 <div>
 <Label className="text-xs text-muted-foreground mb-1 block text-start">
 {t('contactDirectory.form.email_addresses')}
 </Label>
 <div className="space-y-2">
 {contact.email_addresses?.map((email, index) => (
 <div key={index} className="flex gap-2">
 <Input
 type="email"
 value={email}
 onChange={(e) =>
 handleEmailChange(contact.id, index, e.target.value)
 }
 placeholder={t('contactDirectory.form.email_placeholder')}
 className="h-9"
 />
 {contact.email_addresses && contact.email_addresses.length > 1 && (
 <Button
 type="button"
 variant="ghost"
 size="icon"
 onClick={() => handleRemoveEmail(contact.id, index)}
 className="flex-shrink-0 min-h-9 min-w-9"
 >
 <Trash2 className="h-3 w-3" />
 </Button>
 )}
 </div>
 ))}
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={() => handleAddEmail(contact.id)}
 className="w-full h-8 text-xs"
 >
 {t('contactDirectory.form.add_email')}
 </Button>
 </div>
 </div>

 {/* Phone Numbers */}
 <div>
 <Label className="text-xs text-muted-foreground mb-1 block text-start">
 {t('contactDirectory.form.phone_numbers')}
 </Label>
 <div className="space-y-2">
 {contact.phone_numbers?.map((phone, index) => (
 <div key={index} className="flex gap-2">
 <Input
 type="tel"
 value={phone}
 onChange={(e) =>
 handlePhoneChange(contact.id, index, e.target.value)
 }
 placeholder={t('contactDirectory.form.phone_placeholder')}
 className="h-9"
 />
 {contact.phone_numbers && contact.phone_numbers.length > 1 && (
 <Button
 type="button"
 variant="ghost"
 size="icon"
 onClick={() => handleRemovePhone(contact.id, index)}
 className="flex-shrink-0 min-h-9 min-w-9"
 >
 <Trash2 className="h-3 w-3" />
 </Button>
 )}
 </div>
 ))}
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={() => handleAddPhone(contact.id)}
 className="w-full h-8 text-xs"
 >
 {t('contactDirectory.form.add_phone')}
 </Button>
 </div>
 </div>
 </div>

 {/* Remove Button */}
 <Button
 type="button"
 variant="ghost"
 size="icon"
 onClick={() => handleRemoveContact(contact.id)}
 className="flex-shrink-0 min-h-9 min-w-9"
 >
 <Trash2 className="h-4 w-4 text-destructive" />
 </Button>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>

 {/* No Contacts */}
 {contacts.length === 0 && (
 <Alert>
 <AlertCircle className="h-4 w-4" />
 <AlertDescription className="text-start">
 {t('contactDirectory.documentExtraction.no_contacts_to_review')}
 </AlertDescription>
 </Alert>
 )}

 {/* Action Buttons */}
 <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t">
 <Button
 type="button"
 variant="outline"
 onClick={onCancel}
 disabled={isImporting}
 className="h-11 sm:h-10"
 >
 {t('contactDirectory.form.cancel')}
 </Button>
 <Button
 type="button"
 onClick={handleImportClick}
 disabled={selectedContacts.length === 0 || isImporting}
 className="h-11 sm:h-10 flex-1"
 >
 {isImporting ? (
 <>
 <div className={`animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`} />
 {t('contactDirectory.documentExtraction.importing')}
 </>
 ) : (
 <>
 {t('contactDirectory.documentExtraction.import_selected')} ({selectedContacts.length})
 </>
 )}
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 );
}
