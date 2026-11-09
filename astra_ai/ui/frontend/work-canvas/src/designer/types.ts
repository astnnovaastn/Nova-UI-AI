/** Provider-free canvas contracts shared by the React bridge, Svelte host and worker. */
export type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};
export type Constraint = {
    pinned?: boolean;
    manual?: boolean;
    lockedSize?: boolean;
};
export type LayoutNode = Rect & {
    id: string;
    type: string;
    title: string;
    group?: string;
    role?: string;
    parentId?: string;
    selected?: boolean;
    editing?: boolean;
    dragging?: boolean;
    container?: boolean;
    minWidth?: number;
    minHeight?: number;
    constraint?: Constraint;
};
export type LayoutEdge = {
    id: string;
    source: string;
    target: string;
};
export type LayoutGroup = Rect & {
    id: string;
    title: string;
    members: string[];
};
export type Geometry = {
    positions: Record<string, {
        x: number;
        y: number;
    }>;
    sizes: Record<string, {
        width: number;
        height: number;
    }>;
    groups: LayoutGroup[];
    constraints: Record<string, Constraint>;
};
export type LayoutRecord = Geometry & {
    schema_version: 1;
    revision: number;
    strategy: string;
    automatic: boolean;
    operation_id: string;
    previous: Geometry | null;
};
export type LayoutSave = {
    expected_revision: number;
    operation_id: string;
    layout: Geometry & {
        strategy: string;
        automatic: boolean;
    };
    undo?: boolean;
    before?: Geometry;
};
export type Snapshot = {
    nodes: LayoutNode[];
    edges: LayoutEdge[];
    viewport: {
        x: number;
        y: number;
        zoom: number;
    };
    width: number;
    height: number;
};
export type LayoutInput = Snapshot & {
    topic?: string;
    strategy: string;
    selectedOnly?: boolean;
    incremental?: boolean;
    known?: string[];
};
export type LayoutPlan = {
    strategy: string;
    reason: string;
    geometry: Geometry;
    order: string[];
    routes: LayoutEdge[];
    warnings: string[];
    requiresPreview: boolean;
    score: number;
};
export type Cursor = {
    x: number;
    y: number;
    label: string;
    target: string;
    phase: 'approach' | 'grab' | 'release';
};
export type CanvasDesignerApi = {
    snapshot(): Snapshot;
    setGeometry(geometry: Geometry, provisional?: boolean): void;
    setAnimating(value: boolean): void;
    screenPoint(x: number, y: number): {
        x: number;
        y: number;
    };
    follow(id: string): void;
    focus?(id: string): void;
};
export const emptyGeometry = (): Geometry => ({ positions: {}, sizes: {}, groups: [], constraints: {} });
export const emptyRecord = (): LayoutRecord => ({ ...emptyGeometry(), schema_version: 1, revision: 0, strategy: 'auto', automatic: false, operation_id: '', previous: null });
