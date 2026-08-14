import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { resetModal } from '../store/slices';
import { RootState } from '../store/store';
import ReuseModal from './ReuseModal';

export default function GlobalModal() {
  const modal = useSelector((state: RootState) => state.common.modal);
  const dispatch = useDispatch();

  return (
    <ReuseModal
      {...modal}
      onCancel={modal.onCancel || (() => dispatch(resetModal()))}
    />
  );
}
