"use client";

import { deleteQrCodeAction } from "./actions";

export function DeleteQrCodeForm({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <form
      action={deleteQrCodeAction}
      onSubmit={(event) => {
        if (!window.confirm(`Delete "${name}" and its scan history?`)) {
          event.preventDefault();
        }
      }}
    >
      <input name="id" type="hidden" value={id} />
      <button className="qr-delete-action" type="submit">Delete</button>
    </form>
  );
}
