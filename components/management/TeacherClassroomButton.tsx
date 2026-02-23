'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClassroomLinkDialog } from '@/components/management/ClassroomLinkDialog';
import { GraduationCap } from 'lucide-react';

interface TeacherClassroomButtonProps {
    teacherId: string;
    teacherName: string;
    allClassrooms: { id: string; name: string; grade: string }[];
    linkedClassroomIds: string[];
}

export function TeacherClassroomButton({
    teacherId,
    teacherName,
    allClassrooms,
    linkedClassroomIds
}: TeacherClassroomButtonProps) {
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(true)}
                className="gap-2"
            >
                <GraduationCap className="h-4 w-4" />
                Turmas ({linkedClassroomIds.length})
            </Button>

            <ClassroomLinkDialog
                teacherId={teacherId}
                teacherName={teacherName}
                allClassrooms={allClassrooms}
                linkedClassroomIds={linkedClassroomIds}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />
        </>
    );
}
