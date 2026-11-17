import unittest
from copy import deepcopy
from astra_ai.core.work.contracts import RunState, load, as_dict
from astra_ai.core.work import card_objects as cards
from astra_ai.core.work.card_catalog import FAMILIES, PRESETS


def command(family='answer', **changes):
    value=dict(op='create',command_id='c1',object_id='o1',expected_revision=0,family=family,
               preset=family+'.1.reading',state='partial',payload=dict(title='A real result',body='Observed content',sources=[{'id':'S1'}]))
    value.update(changes)
    return value


class CardObjectsTests(unittest.TestCase):
    def setUp(self):
        self.run=RunState('test','test',evidence=[dict(id='S1',title='Recorded source',url='https://example.com/evidence')])

    def test_registry_is_cross_workflow_and_only_admits_released_presets(self):
        self.assertEqual(len(FAMILIES),20)
        self.assertEqual(len(PRESETS),800)
        self.assertTrue(all(len(f['uses'])==15 and len(f['presets'])==40 for f in FAMILIES.values()))
        self.assertTrue(all(len(r['presets'])==40 for r in cards.find('architecture','explain-code')))
        with self.assertRaisesRegex(ValueError,'unavailable_preset'):
            cards.apply(self.run,command(preset='answer.missing.1'))

    def test_create_revise_retry_stale_and_restore(self):
        c=command(); cards.apply(self.run,c)
        self.assertTrue(cards.apply(self.run,c)['replayed'])
        self.assertEqual(len(self.run.canvas_objects),1)
        revised=command(op='revise',command_id='c2',expected_revision=1,payload=dict(title='Updated',body='More recorded detail',sources=[]))
        cards.apply(self.run,revised)
        restored=load(RunState,as_dict(self.run))
        self.assertEqual(restored.canvas_objects[0]['revision'],2)
        self.assertEqual(restored.card_state['history']['o1'][0]['title'],'A real result')
        with self.assertRaisesRegex(ValueError,'stale_revision'):
            cards.apply(restored,dict(revised,command_id='c3'))

    def test_publication_retains_objects_and_invalid_update_is_atomic(self):
        cards.apply(self.run,command()); before=deepcopy(self.run.canvas_objects)
        with self.assertRaises(ValueError):
            cards.apply(self.run,command(op='revise',command_id='c2',expected_revision=1,payload={'title':'Bad','script':'alert(1)'}))
        self.assertEqual(self.run.canvas_objects,before)
        merged=cards.merge_projection(before,[{'id':'result','body':'complete report'}])
        self.assertEqual(len(merged),2)

    def test_evidence_is_resolved_not_fabricated_and_unknown_rejected(self):
        cards.apply(self.run,command(payload=dict(title='Result',body='Claim',sources=[dict(id='S1',title='Invented',url='https://wrong.test')],
            provenance=[dict(path='/body',basis='sourced',source_ids=['S1'])])))
        self.assertEqual(self.run.canvas_objects[0]['sources'][0]['title'],'Recorded source')
        with self.assertRaisesRegex(ValueError,'unknown_evidence'):
            cards.apply(self.run,command(command_id='c2',object_id='o2',payload=dict(title='Fake',sources=[{'id':'S9'}])))

    def test_category_map_supports_one_hundred_items_without_false_edges(self):
        nodes=[dict(id=f'n{i}',label=f'Module {i}',group=str(i%5)) for i in range(100)]
        cards.apply(self.run,command('category-map',state='complete',payload=dict(title='Modules',nodes=nodes,edges=[],sources=[])))
        self.assertEqual(len(self.run.canvas_objects[0]['nodes']),100)
        with self.assertRaisesRegex(ValueError,'category_map_has_edges'):
            cards.apply(self.run,command('category-map',object_id='o2',command_id='c2',payload=dict(title='Modules',nodes=nodes,edges=[dict(id='e1',source='n0',target='n1')],sources=[])))

    def test_table_preserves_null_and_requires_stable_rows(self):
        payload=dict(title='Records',columns=['Name','Measured value'],rows=[['One',None],['Two',0]],row_ids=['one','two'],sources=[])
        cards.apply(self.run,command('table',state='complete',payload=payload))
        self.assertIsNone(self.run.canvas_objects[0]['rows'][0][1])
        payload['row_ids']=['one','one']
        with self.assertRaisesRegex(ValueError,'invalid_row_ids'): cards.validate(payload,'table','table.1.reading','complete',[])

    def test_user_edits_become_reviewable_proposals(self):
        cards.apply(self.run,command());self.run.canvas_objects[0]['user_edited']=True
        r=cards.apply(self.run,command(op='revise',expected_revision=1,command_id='c2',payload=dict(title='Suggested',body='Proposal',sources=[])))
        self.assertEqual(r['status'],'review-required')
        self.assertEqual(self.run.canvas_objects[0]['revision'],1)
        self.assertIn('c2',self.run.card_state['proposals'])

    def test_no_fake_execution_or_browser_side_effects(self):
        with self.assertRaisesRegex(ValueError,'execution_record_required'):
            cards.apply(self.run,command('test',state='complete'))
        for url in ['javascript:alert(1)','file:///etc/passwd','https://user:secret@example.com']:
            with self.assertRaises(ValueError): cards.apply(self.run,command(payload=dict(title='Bad',url=url,sources=[])))

    def test_invalid_dates_and_unresolved_edges(self):
        with self.assertRaisesRegex(ValueError,'invalid_date'):
            cards.apply(self.run,command('calendar',payload=dict(title='Dates',entries=[dict(id='d1',date='2026-02-31')],sources=[])))
        with self.assertRaisesRegex(ValueError,'unresolved_edge'):
            cards.apply(self.run,command('diagram',payload=dict(title='Graph',nodes=[dict(id='n1')],edges=[dict(id='e1',source='n1',target='missing')],sources=[])))

if __name__=='__main__':unittest.main()
