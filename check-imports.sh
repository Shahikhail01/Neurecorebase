#!/bin/bash
# Find all external package imports in tenant frontend
grep -rh "from '" /var/www/neurecore-tenant/src --include='*.tsx' --include='*.ts' | \
  grep -v "from './" | grep -v "from '@/" | \
  sed "s/.*from '//;s/'.*//" | \
  grep -v "^\." | sort -u

grep -rh 'from "' /var/www/neurecore-tenant/src --include='*.tsx' --include='*.ts' | \
  grep -v 'from "./' | grep -v 'from "@/' | \
  sed 's/.*from "//;s/".*//' | \
  grep -v "^\." | sort -u
