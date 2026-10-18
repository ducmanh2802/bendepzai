import { Topic } from '../../types';
import { HELLO_TOPIC } from './unit01';
import { SCHOOL_TOPIC } from './unit02';
import { TOYS_TOPIC } from './unit03';
import { FAMILY_TOPIC } from './unit04';
import { PETS_TOPIC } from './unit05';
import { FACE_TOPIC } from './unit06';
import { UNIT7_TOPIC } from './unit07';
import { UNIT8_TOPIC } from './unit08';
import { UNIT9_TOPIC } from './unit09';
import { UNIT10_TOPIC } from './unit10';
import { UNIT11_TOPIC } from './unit11';
import { UNIT12_TOPIC } from './unit12';

/**
 * T12A/T12B — extra English topics (Kid's Box-style units 1–12).
 *
 * Kept in separate files so the huge `englishCurriculum.ts` literal stays
 * small (free-model output limit) and each unit can be reviewed on its own.
 */
export const ENGLISH_UNIT_TOPICS: Topic[] = [
  HELLO_TOPIC,
  SCHOOL_TOPIC,
  TOYS_TOPIC,
  FAMILY_TOPIC,
  PETS_TOPIC,
  FACE_TOPIC,
  UNIT7_TOPIC,
  UNIT8_TOPIC,
  UNIT9_TOPIC,
  UNIT10_TOPIC,
  UNIT11_TOPIC,
  UNIT12_TOPIC,
];
