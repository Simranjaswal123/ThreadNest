// A small helper for building a WHERE clause from optional filters.
// Every value goes into a parameter ($1, $2, ...). It is never pasted into the SQL text.
//
//   const filter = createFilter();
//   filter.add('status = ?', 'paid');        // becomes: status = $1
//   filter.where()                            // 'WHERE status = $1'
//   filter.values                             // ['paid']
export function createFilter() {
  const conditions = [];
  const values = [];

  return {
    values: values,

    // Every "?" in the condition is replaced by the same new parameter number.
    add(condition, value) {
      values.push(value);
      conditions.push(condition.replaceAll('?', '$' + values.length));
    },

    // For a condition that needs no value, like "role = 'customer'".
    addFixed(condition) {
      conditions.push(condition);
    },

    where() {
      return conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    },
  };
}

// % and _ are wildcards in LIKE. Escape them so a search for "50%" means exactly that.
export function escapeLike(text) {
  return text.replace(/[\\%_]/g, '\\$&');
}
