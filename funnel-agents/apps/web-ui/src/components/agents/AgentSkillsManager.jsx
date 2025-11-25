import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Award, TrendingUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

const SKILL_LEVELS = {
  beginner: { label: 'Beginner', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  intermediate: { label: 'Intermediate', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  expert: { label: 'Expert', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
};

const COMMON_SKILLS = [
  'SEO', 'Content Writing', 'Social Media', 'Email Marketing', 'PPC Advertising',
  'Data Analysis', 'Copywriting', 'Graphic Design', 'Video Editing', 'Research',
  'Lead Generation', 'Sales Outreach', 'Customer Support', 'Project Management',
  'Market Research', 'Competitor Analysis', 'Brand Strategy', 'Analytics',
];

export default function AgentSkillsManager({ agent, onUpdateSkills }) {
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('intermediate');
  const [newSkillYears, setNewSkillYears] = useState('');
  const [editingSkill, setEditingSkill] = useState(null);

  const currentSkills = agent.skills || [];

  const handleAddSkill = () => {
    if (!newSkillName.trim()) {
      toast.error('Please enter a skill name');
      return;
    }

    if (currentSkills.some(s => s.name.toLowerCase() === newSkillName.toLowerCase())) {
      toast.error('This skill already exists');
      return;
    }

    const newSkill = {
      name: newSkillName.trim(),
      level: newSkillLevel,
      years_experience: newSkillYears ? parseFloat(newSkillYears) : undefined,
    };

    const updatedSkills = [...currentSkills, newSkill];
    onUpdateSkills(updatedSkills);

    setNewSkillName('');
    setNewSkillLevel('intermediate');
    setNewSkillYears('');
    setShowAddSkill(false);
    toast.success(`Added skill: ${newSkill.name}`);
  };

  const handleRemoveSkill = (skillName) => {
    const updatedSkills = currentSkills.filter(s => s.name !== skillName);
    onUpdateSkills(updatedSkills);
    toast.success(`Removed skill: ${skillName}`);
  };

  const handleUpdateSkillLevel = (skillName, newLevel) => {
    const updatedSkills = currentSkills.map(s =>
      s.name === skillName ? { ...s, level: newLevel } : s
    );
    onUpdateSkills(updatedSkills);
    toast.success(`Updated ${skillName} to ${SKILL_LEVELS[newLevel].label}`);
  };

  const handleQuickAddSkill = (skillName) => {
    if (currentSkills.some(s => s.name.toLowerCase() === skillName.toLowerCase())) {
      toast.error('Skill already added');
      return;
    }

    const newSkill = {
      name: skillName,
      level: 'intermediate',
    };

    const updatedSkills = [...currentSkills, newSkill];
    onUpdateSkills(updatedSkills);
    toast.success(`Added skill: ${skillName}`);
  };

  const getSkillStats = () => {
    const total = currentSkills.length;
    const experts = currentSkills.filter(s => s.level === 'expert').length;
    const intermediate = currentSkills.filter(s => s.level === 'intermediate').length;
    const beginners = currentSkills.filter(s => s.level === 'beginner').length;
    
    return { total, experts, intermediate, beginners };
  };

  const stats = getSkillStats();

  return (
    <div className="space-y-4">
      {/* Skills Overview */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3 bg-slate-800/50 border-slate-700/50">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-slate-400">Total Skills</p>
          </div>
        </Card>
        <Card className="p-3 bg-green-500/10 border-green-500/20">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{stats.experts}</p>
            <p className="text-xs text-green-400">Expert</p>
          </div>
        </Card>
        <Card className="p-3 bg-yellow-500/10 border-yellow-500/20">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.intermediate}</p>
            <p className="text-xs text-yellow-400">Intermediate</p>
          </div>
        </Card>
        <Card className="p-3 bg-blue-500/10 border-blue-500/20">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.beginners}</p>
            <p className="text-xs text-blue-400">Beginner</p>
          </div>
        </Card>
      </div>

      {/* Add Skill Section */}
      <Card className="p-4 bg-slate-800/50 border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-blue-400" />
            <h4 className="font-medium text-white">Skills & Expertise</h4>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddSkill(!showAddSkill)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Skill
          </Button>
        </div>

        {showAddSkill && (
          <div className="space-y-3 mb-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
            <Input
              placeholder="Skill name (e.g., SEO, Content Writing)"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white"
            />
            <div className="grid grid-cols-2 gap-3">
              <Select value={newSkillLevel} onValueChange={setNewSkillLevel}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="beginner" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                    Beginner
                  </SelectItem>
                  <SelectItem value="intermediate" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                    Intermediate
                  </SelectItem>
                  <SelectItem value="expert" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                    Expert
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Years (optional)"
                value={newSkillYears}
                onChange={(e) => setNewSkillYears(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
                min="0"
                max="50"
                step="0.5"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handleAddSkill}
                className="bg-green-600 hover:bg-green-700 flex-1"
              >
                Add Skill
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowAddSkill(false);
                  setNewSkillName('');
                  setNewSkillYears('');
                }}
                className="border-slate-700 text-white hover:bg-slate-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Quick Add Common Skills */}
        {showAddSkill && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2">Quick add common skills:</p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SKILLS.filter(skill => 
                !currentSkills.some(s => s.name.toLowerCase() === skill.toLowerCase())
              ).map(skill => (
                <button
                  key={skill}
                  onClick={() => handleQuickAddSkill(skill)}
                  className="text-xs px-2 py-1 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current Skills */}
        <div className="space-y-2">
          {currentSkills.length > 0 ? (
            currentSkills.map((skill, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <TrendingUp className={`w-4 h-4 ${
                    skill.level === 'expert' ? 'text-green-400' :
                    skill.level === 'intermediate' ? 'text-yellow-400' :
                    'text-blue-400'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm">{skill.name}</p>
                    {skill.years_experience && (
                      <p className="text-xs text-slate-500">
                        {skill.years_experience} {skill.years_experience === 1 ? 'year' : 'years'} experience
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Select
                    value={skill.level}
                    onValueChange={(level) => handleUpdateSkillLevel(skill.name, level)}
                  >
                    <SelectTrigger className="w-32 h-7 text-xs bg-slate-800/50 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="beginner" className="text-slate-300 focus:bg-slate-700 focus:text-white text-xs">
                        🟦 Beginner
                      </SelectItem>
                      <SelectItem value="intermediate" className="text-slate-300 focus:bg-slate-700 focus:text-white text-xs">
                        🟨 Intermediate
                      </SelectItem>
                      <SelectItem value="expert" className="text-slate-300 focus:bg-slate-700 focus:text-white text-xs">
                        🟩 Expert
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveSkill(skill.name)}
                    className="h-7 w-7 text-slate-400 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Award className="w-12 h-12 mx-auto mb-2 text-slate-600" />
              <p className="text-sm">No skills added yet</p>
              <p className="text-xs mt-1">Click "Add Skill" to get started</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}