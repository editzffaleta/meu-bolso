'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Combobox } from '@/shared/components/ui/combobox';
import { Dialog } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { StandardDialogContent } from '@/shared/components/ui/standard-dialog-content';
import {
  ACCOUNT_TYPE_OPTIONS,
  type Account,
  type AccountFormValues,
  type AccountType,
} from '@/modules/accounts/types/account.type';

type AccountFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  isSubmitting: boolean;
  onSubmit: (values: AccountFormValues) => void;
};

const EMPTY_FORM: AccountFormValues = {
  name: '',
  type: 'checking',
  institution: '',
  initialBalance: '0',
};

function accountToFormValues(account: Account | null): AccountFormValues {
  if (!account) return EMPTY_FORM;

  return {
    name: account.name,
    type: account.type,
    institution: account.institution ?? '',
    initialBalance: String(account.initialBalance),
  };
}

export function AccountFormDialog(props: AccountFormDialogProps) {
  return <AccountFormDialogContent key={props.account?.id ?? 'new'} {...props} />;
}

function AccountFormDialogContent({
  open,
  onOpenChange,
  account,
  isSubmitting,
  onSubmit,
}: AccountFormDialogProps) {
  const [values, setValues] = useState<AccountFormValues>(() => accountToFormValues(account));
  const isEditing = Boolean(account);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <StandardDialogContent
        title={isEditing ? 'Editar conta' : 'Nova conta'}
        description="Informe os dados da conta financeira."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="account-form"
              disabled={isSubmitting}
              data-testid="account-form-submit"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar conta'}
            </Button>
          </>
        }
      >
        <form id="account-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="account-name">Nome da conta</Label>
            <Input
              id="account-name"
              name="name"
              data-testid="account-form-name"
              value={values.name}
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="account-type">Tipo</Label>
              <Combobox
                options={ACCOUNT_TYPE_OPTIONS}
                value={values.type}
                onChange={(value) =>
                  setValues((current) => ({ ...current, type: value as AccountType }))
                }
                placeholder="Selecione o tipo"
                data-testid="account-form-type"
              />
            </div>

            <div>
              <Label htmlFor="account-institution">Instituição</Label>
              <Input
                id="account-institution"
                name="institution"
                value={values.institution}
                onChange={(event) =>
                  setValues((current) => ({ ...current, institution: event.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="account-initial-balance">Saldo inicial</Label>
            <Input
              id="account-initial-balance"
              name="initialBalance"
              type="number"
              step="0.01"
              className="font-mono-money"
              value={values.initialBalance}
              onChange={(event) =>
                setValues((current) => ({ ...current, initialBalance: event.target.value }))
              }
              required
            />
          </div>
        </form>
      </StandardDialogContent>
    </Dialog>
  );
}
