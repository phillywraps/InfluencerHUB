import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchUserTeams = createAsyncThunk(
  'team/fetchUserTeams',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/teams');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createTeam = createAsyncThunk(
  'team/createTeam',
  async (teamData, { rejectWithValue }) => {
    try {
      const response = await api.post('/teams', teamData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateTeam = createAsyncThunk(
  'team/updateTeam',
  async ({ teamId, teamData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/teams/${teamId}`, teamData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteTeam = createAsyncThunk(
  'team/deleteTeam',
  async (teamId, { rejectWithValue }) => {
    try {
      await api.delete(`/teams/${teamId}`);
      return teamId;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const inviteTeamMember = createAsyncThunk(
  'team/inviteTeamMember',
  async ({ teamId, invitation }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/teams/${teamId}/invitations`, invitation);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const removeTeamMember = createAsyncThunk(
  'team/removeTeamMember',
  async ({ teamId, memberId }, { rejectWithValue }) => {
    try {
      await api.delete(`/teams/${teamId}/members/${memberId}`);
      return { teamId, memberId };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateTeamMemberRole = createAsyncThunk(
  'team/updateTeamMemberRole',
  async ({ teamId, memberId, roleId }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/teams/${teamId}/members/${memberId}`, { roleId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchTeamRoles = createAsyncThunk(
  'team/fetchTeamRoles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/roles');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createCollaborationSpace = createAsyncThunk(
  'team/createCollaborationSpace',
  async ({ teamId, spaceData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/teams/${teamId}/collaborationSpaces`, spaceData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Initial state
const initialState = {
  teams: [],
  currentTeam: null,
  members: {},
  invitations: {},
  collaborationSpaces: {},
  roles: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

// Team slice
const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    setCurrentTeam(state, action) {
      state.currentTeam = action.payload;
    },
    clearTeamState(state) {
      state.teams = [];
      state.currentTeam = null;
      state.members = {};
      state.invitations = {};
      state.collaborationSpaces = {};
      state.status = 'idle';
      state.error = null;
    },
    resetTeamStatus(state) {
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user teams
      .addCase(fetchUserTeams.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserTeams.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.teams = action.payload;
        
        // Initialize members and invitations for each team
        action.payload.forEach(team => {
          if (!state.members[team.id]) {
            state.members[team.id] = team.members || [];
          }
          if (!state.invitations[team.id]) {
            state.invitations[team.id] = team.invitations || [];
          }
          if (!state.collaborationSpaces[team.id]) {
            state.collaborationSpaces[team.id] = team.collaborationSpaces || [];
          }
        });
        
        // If no current team is selected and teams exist, set the first one as current
        if (!state.currentTeam && action.payload.length > 0) {
          state.currentTeam = action.payload[0];
        }
      })
      .addCase(fetchUserTeams.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch teams';
      })
      
      // Create team
      .addCase(createTeam.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createTeam.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.teams.push(action.payload);
        state.currentTeam = action.payload;
        state.members[action.payload.id] = action.payload.members || [];
        state.invitations[action.payload.id] = [];
        state.collaborationSpaces[action.payload.id] = [];
      })
      .addCase(createTeam.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to create team';
      })
      
      // Update team
      .addCase(updateTeam.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateTeam.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.teams.findIndex(team => team.id === action.payload.id);
        if (index !== -1) {
          state.teams[index] = {
            ...state.teams[index],
            ...action.payload,
          };
          
          // If this is the current team, update it as well
          if (state.currentTeam && state.currentTeam.id === action.payload.id) {
            state.currentTeam = {
              ...state.currentTeam,
              ...action.payload,
            };
          }
        }
      })
      .addCase(updateTeam.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to update team';
      })
      
      // Delete team
      .addCase(deleteTeam.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteTeam.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.teams = state.teams.filter(team => team.id !== action.payload);
        
        // Clear related data
        delete state.members[action.payload];
        delete state.invitations[action.payload];
        delete state.collaborationSpaces[action.payload];
        
        // If deleted team was the current team, set to another team or null
        if (state.currentTeam && state.currentTeam.id === action.payload) {
          state.currentTeam = state.teams.length > 0 ? state.teams[0] : null;
        }
      })
      .addCase(deleteTeam.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to delete team';
      })
      
      // Invite team member
      .addCase(inviteTeamMember.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(inviteTeamMember.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { teamId } = action.meta.arg;
        state.invitations[teamId].push(action.payload);
      })
      .addCase(inviteTeamMember.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to invite team member';
      })
      
      // Remove team member
      .addCase(removeTeamMember.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(removeTeamMember.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { teamId, memberId } = action.meta.arg;
        state.members[teamId] = state.members[teamId].filter(
          member => member.id !== memberId
        );
      })
      .addCase(removeTeamMember.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to remove team member';
      })
      
      // Update team member role
      .addCase(updateTeamMemberRole.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateTeamMemberRole.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { teamId, memberId } = action.meta.arg;
        const memberIndex = state.members[teamId].findIndex(
          member => member.id === memberId
        );
        
        if (memberIndex !== -1) {
          state.members[teamId][memberIndex] = action.payload;
        }
      })
      .addCase(updateTeamMemberRole.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to update team member role';
      })
      
      // Fetch team roles
      .addCase(fetchTeamRoles.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTeamRoles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.roles = action.payload;
      })
      .addCase(fetchTeamRoles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch team roles';
      })
      
      // Create collaboration space
      .addCase(createCollaborationSpace.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createCollaborationSpace.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { teamId } = action.meta.arg;
        if (!state.collaborationSpaces[teamId]) {
          state.collaborationSpaces[teamId] = [];
        }
        state.collaborationSpaces[teamId].push(action.payload);
      })
      .addCase(createCollaborationSpace.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to create collaboration space';
      });
  },
});

// Export actions and reducer
export const { setCurrentTeam, clearTeamState, resetTeamStatus } = teamSlice.actions;

export default teamSlice.reducer;

// Selectors
export const selectAllTeams = state => state.team.teams;
export const selectCurrentTeam = state => state.team.currentTeam;
export const selectTeamMembers = (state, teamId) => state.team.members[teamId] || [];
export const selectTeamInvitations = (state, teamId) => state.team.invitations[teamId] || [];
export const selectTeamCollaborationSpaces = (state, teamId) => 
  state.team.collaborationSpaces[teamId] || [];
export const selectAllRoles = state => state.team.roles;
export const selectTeamStatus = state => state.team.status;
export const selectTeamError = state => state.team.error;
